import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function createOrbitControls(camera, renderer) {
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = true;
    controls.enableZoom = true;
    controls.enableRotate = true;
    controls.minDistance = 30;
    controls.maxDistance = 300;
    controls.autoRotate = false;
    controls.autoRotateSpeed = 2.0;
    return controls;
}

export function createAutoRotateState() {
    return {
        enabled: true,
        speed: 1.0
    };
}

export function updateAutoRotate(particles, autoRotateState, deltaTime) {
    if (autoRotateState.enabled && particles) {
        particles.rotation.y += 0.005 * autoRotateState.speed;
    }
}

export function setAutoRotateEnabled(autoRotateState, enabled) {
    autoRotateState.enabled = enabled;
}

export function setAutoRotateSpeed(autoRotateState, speed) {
    autoRotateState.speed = speed;
}
