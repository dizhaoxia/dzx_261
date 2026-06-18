import * as THREE from 'three';

export function createParticleSystem(positions, color = 0x00ffff, size = 1) {
    const geometry = new THREE.BufferGeometry();
    const positionAttribute = new THREE.Float32BufferAttribute(positions, 3);
    geometry.setAttribute('position', positionAttribute);
    
    const count = positions.length / 3;
    const colors = new Float32Array(count * 3);
    const colorObj = new THREE.Color(color);
    
    for (let i = 0; i < count; i++) {
        colors[i * 3] = colorObj.r;
        colors[i * 3 + 1] = colorObj.g;
        colors[i * 3 + 2] = colorObj.b;
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const material = new THREE.PointsMaterial({
        size: size,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    
    const particles = new THREE.Points(geometry, material);
    return particles;
}

export function updateParticlePositions(particles, newPositions) {
    const geometry = particles.geometry;
    const positionAttribute = geometry.getAttribute('position');
    
    if (newPositions.length !== positionAttribute.array.length) {
        return { needsRecreate: true };
    } else {
        positionAttribute.array.set(newPositions);
        positionAttribute.needsUpdate = true;
        geometry.computeBoundingSphere();
        return { needsRecreate: false };
    }
}

export function recreateParticleSystem(scene, oldParticles, newPositions, color, size) {
    const newParticles = createParticleSystem(newPositions, color, size);
    
    if (oldParticles) {
        scene.remove(oldParticles);
        if (oldParticles.geometry) {
            oldParticles.geometry.dispose();
        }
        if (oldParticles.material) {
            oldParticles.material.dispose();
        }
    }
    
    scene.add(newParticles);
    return newParticles;
}

export function updateParticleSize(particles, size) {
    particles.material.size = size;
    particles.material.needsUpdate = true;
}

export function updateParticleColor(particles, color) {
    const geometry = particles.geometry;
    const colorAttribute = geometry.getAttribute('color');
    const colorObj = new THREE.Color(color);
    
    for (let i = 0; i < colorAttribute.count; i++) {
        colorAttribute.array[i * 3] = colorObj.r;
        colorAttribute.array[i * 3 + 1] = colorObj.g;
        colorAttribute.array[i * 3 + 2] = colorObj.b;
    }
    colorAttribute.needsUpdate = true;
}
