import * as THREE from 'three';

export function createScene() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0f);
    return scene;
}

export function updateSceneBackground(scene, transparent) {
    if (transparent) {
        scene.background = null;
    } else {
        scene.background = new THREE.Color(0x0a0a0f);
    }
}

export function createCamera() {
    const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 0, 100);
    return camera;
}

export function createRenderer(container, alpha = true) {
    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        preserveDrawingBuffer: true,
        alpha: alpha
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    return renderer;
}

export function createLights(scene) {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const pointLight = new THREE.PointLight(0x00ffff, 1);
    pointLight.position.set(50, 50, 50);
    scene.add(pointLight);
    
    const pointLight2 = new THREE.PointLight(0xff00ff, 1);
    pointLight2.position.set(-50, -50, 50);
    scene.add(pointLight2);
}

export function handleResize(camera, renderer) {
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}
