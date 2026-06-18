import * as THREE from 'three';
import { createScene, createCamera, createRenderer, createLights, handleResize } from './scene.js';
import { createOrbitControls, createAutoRotateState, updateAutoRotate } from './controls.js';
import { textToParticlePositions } from './textToParticles.js';
import { createParticleSystem, updateParticlePositions, recreateParticleSystem, updateParticleSize, updateParticleColor } from './particleSystem.js';
import { captureAndDownload } from './screenshot.js';

let scene, camera, renderer, controls, particles;
let autoRotateState = createAutoRotateState();

const state = {
    text: 'HELLO',
    fontSize: 100,
    particleSize: 1.0,
    particleColor: '#00ffff',
    autoRotate: true,
    rotateSpeed: 1.0
};

function init() {
    const container = document.getElementById('canvas-container');
    
    scene = createScene();
    camera = createCamera();
    renderer = createRenderer(container);
    createLights(scene);
    
    controls = createOrbitControls(camera, renderer);
    handleResize(camera, renderer);
    
    generateParticles();
    setupUIEvents();
    hideLoading();
    animate();
}

function generateParticles() {
    const positions = textToParticlePositions(state.text, state.fontSize, 2);
    
    if (particles) {
        scene.remove(particles);
    }
    
    particles = createParticleSystem(positions, state.particleColor, state.particleSize);
    scene.add(particles);
}

function updateParticles() {
    const positions = textToParticlePositions(state.text, state.fontSize, 2);
    const oldRotation = particles.rotation.y;
    particles = recreateParticleSystem(scene, particles, positions, state.particleColor, state.particleSize);
    particles.rotation.y = oldRotation;
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
        updateParticleColor(particles, state.particleColor);
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
