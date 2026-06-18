import * as THREE from 'three';
import { createScene, createCamera, createRenderer, createLights, handleResize, updateSceneBackground } from './scene.js';
import { createOrbitControls, createAutoRotateState, updateAutoRotate } from './controls.js';
import { textToParticlePositions } from './textToParticles.js';
import { createParticleSystem, updateParticlePositions, recreateParticleSystem, updateParticleSize, updateParticleColor, growOrReuseParticleSystem } from './particleSystem.js';
import { captureAndDownload } from './screenshot.js';

let scene, camera, renderer, controls, particles;
let autoRotateState = createAutoRotateState();

const state = {
    text: 'HELLO',
    fontSize: 100,
    particleSize: 1.0,
    particleColor: '#00ffff',
    autoRotate: true,
    rotateSpeed: 1.0,
    gradientEnabled: true,
    gradientStart: '#ff00ff',
    gradientEnd: '#00ffff',
    gradientDirection: 'horizontal',
    diffusion: 1.0,
    transparentBg: false
};

function getColorConfig() {
    return {
        gradientEnabled: state.gradientEnabled,
        singleColor: state.particleColor,
        gradientStart: state.gradientStart,
        gradientEnd: state.gradientEnd,
        gradientDirection: state.gradientDirection
    };
}

function init() {
    const container = document.getElementById('canvas-container');
    
    scene = createScene();
    camera = createCamera();
    renderer = createRenderer(container, true);
    createLights(scene);
    
    controls = createOrbitControls(camera, renderer);
    handleResize(camera, renderer);
    
    generateParticles();
    setupUIEvents();
    updateGradientUI();
    hideLoading();
    animate();
}

function generateParticles() {
    const positions = textToParticlePositions(state.text, state.fontSize, 2, state.diffusion);
    const colorConfig = getColorConfig();
    
    if (particles) {
        scene.remove(particles);
        if (particles.geometry) {
            particles.geometry.dispose();
        }
        if (particles.material) {
            particles.material.dispose();
        }
    }
    
    particles = createParticleSystem(positions, colorConfig, state.particleSize);
    scene.add(particles);
}

function updateParticles() {
    const positions = textToParticlePositions(state.text, state.fontSize, 2, state.diffusion);
    const oldRotation = particles.rotation.y;
    const colorConfig = getColorConfig();
    
    particles = growOrReuseParticleSystem(scene, particles, positions, colorConfig, state.particleSize);
    particles.rotation.y = oldRotation;
}

function updateGradientUI() {
    const singleColorGroup = document.getElementById('single-color-group');
    const gradientColorsGroup = document.getElementById('gradient-colors-group');
    const gradientDirectionGroup = document.getElementById('gradient-direction-group');
    
    if (state.gradientEnabled) {
        singleColorGroup.style.display = 'none';
        gradientColorsGroup.style.display = 'block';
        gradientDirectionGroup.style.display = 'block';
    } else {
        singleColorGroup.style.display = 'block';
        gradientColorsGroup.style.display = 'none';
        gradientDirectionGroup.style.display = 'none';
    }
}

function setupUIEvents() {
    const textInput = document.getElementById('text-input');
    const particleSizeSlider = document.getElementById('particle-size');
    const particleSizeValue = document.getElementById('particle-size-value');
    const particleColorPicker = document.getElementById('particle-color');
    const fontSizeSlider = document.getElementById('font-size');
    const fontSizeValue = document.getElementById('font-size-value');
    const autoRotateCheckbox = document.getElementById('auto-rotate');
    const rotateSpeedSlider = document.getElementById('rotate-speed');
    const rotateSpeedValue = document.getElementById('rotate-speed-value');
    const rotateSpeedGroup = document.getElementById('rotate-speed-group');
    const screenshotBtn = document.getElementById('screenshot-btn');
    
    const gradientEnabledCheckbox = document.getElementById('gradient-enabled');
    const gradientStartPicker = document.getElementById('gradient-start');
    const gradientEndPicker = document.getElementById('gradient-end');
    const gradientDirectionSelect = document.getElementById('gradient-direction');
    
    const diffusionSlider = document.getElementById('diffusion');
    const diffusionValue = document.getElementById('diffusion-value');
    const transparentBgCheckbox = document.getElementById('transparent-bg');
    
    let textUpdateTimeout;
    textInput.addEventListener('input', (e) => {
        state.text = e.target.value || ' ';
        clearTimeout(textUpdateTimeout);
        textUpdateTimeout = setTimeout(() => {
            updateParticles();
        }, 100);
    });
    
    particleSizeSlider.addEventListener('input', (e) => {
        state.particleSize = parseFloat(e.target.value);
        particleSizeValue.textContent = state.particleSize.toFixed(1);
        updateParticleSize(particles, state.particleSize);
    });
    
    particleColorPicker.addEventListener('input', (e) => {
        state.particleColor = e.target.value;
        updateParticleColor(particles, getColorConfig());
    });
    
    fontSizeSlider.addEventListener('input', (e) => {
        state.fontSize = parseInt(e.target.value);
        fontSizeValue.textContent = state.fontSize;
        updateParticles();
    });
    
    autoRotateCheckbox.addEventListener('change', (e) => {
        state.autoRotate = e.target.checked;
        autoRotateState.enabled = state.autoRotate;
        rotateSpeedGroup.style.opacity = state.autoRotate ? '1' : '0.5';
        rotateSpeedGroup.style.pointerEvents = state.autoRotate ? 'auto' : 'none';
    });
    
    rotateSpeedSlider.addEventListener('input', (e) => {
        state.rotateSpeed = parseFloat(e.target.value);
        rotateSpeedValue.textContent = state.rotateSpeed.toFixed(1);
        autoRotateState.speed = state.rotateSpeed;
    });
    
    gradientEnabledCheckbox.addEventListener('change', (e) => {
        state.gradientEnabled = e.target.checked;
        updateGradientUI();
        updateParticleColor(particles, getColorConfig());
    });
    
    gradientStartPicker.addEventListener('input', (e) => {
        state.gradientStart = e.target.value;
        updateParticleColor(particles, getColorConfig());
    });
    
    gradientEndPicker.addEventListener('input', (e) => {
        state.gradientEnd = e.target.value;
        updateParticleColor(particles, getColorConfig());
    });
    
    gradientDirectionSelect.addEventListener('change', (e) => {
        state.gradientDirection = e.target.value;
        updateParticleColor(particles, getColorConfig());
    });
    
    diffusionSlider.addEventListener('input', (e) => {
        state.diffusion = parseFloat(e.target.value);
        diffusionValue.textContent = state.diffusion.toFixed(1);
        updateParticles();
    });
    
    transparentBgCheckbox.addEventListener('change', (e) => {
        state.transparentBg = e.target.checked;
        updateSceneBackground(scene, state.transparentBg);
    });
    
    screenshotBtn.addEventListener('click', async () => {
        const originalText = screenshotBtn.textContent;
        screenshotBtn.textContent = '保存中...';
        screenshotBtn.disabled = true;
        
        const success = await captureAndDownload(renderer);
        
        screenshotBtn.textContent = success ? '已保存!' : '保存失败';
        setTimeout(() => {
            screenshotBtn.textContent = originalText;
            screenshotBtn.disabled = false;
        }, 1500);
    });
}

function hideLoading() {
    const loading = document.getElementById('loading');
    loading.classList.add('hidden');
}

function animate() {
    requestAnimationFrame(animate);
    
    updateAutoRotate(particles, autoRotateState, 16);
    controls.update();
    renderer.render(scene, camera);
}

window.addEventListener('DOMContentLoaded', init);
