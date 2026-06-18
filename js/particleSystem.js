import * as THREE from 'three';

function computeBounds(positions) {
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    
    for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const y = positions[i + 1];
        const z = positions[i + 2];
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
        minZ = Math.min(minZ, z);
        maxZ = Math.max(maxZ, z);
    }
    
    return {
        minX, maxX, centerX: (minX + maxX) / 2,
        minY, maxY, centerY: (minY + maxY) / 2,
        minZ, maxZ, centerZ: (minZ + maxZ) / 2,
        maxRadius: Math.max(
            (maxX - minX) / 2,
            (maxY - minY) / 2
        )
    };
}

function lerpColor(color1, color2, t) {
    return {
        r: color1.r + (color2.r - color1.r) * t,
        g: color1.g + (color2.g - color1.g) * t,
        b: color1.b + (color2.b - color1.b) * t
    };
}

function getGradientFactor(index, positions, bounds, direction) {
    const x = positions[index];
    const y = positions[index + 1];
    
    switch (direction) {
        case 'horizontal':
            return bounds.maxX !== bounds.minX 
                ? (x - bounds.minX) / (bounds.maxX - bounds.minX) 
                : 0.5;
        case 'vertical':
            return bounds.maxY !== bounds.minY 
                ? (y - bounds.minY) / (bounds.maxY - bounds.minY) 
                : 0.5;
        case 'radial':
            const dx = x - bounds.centerX;
            const dy = y - bounds.centerY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            return bounds.maxRadius > 0 ? Math.min(dist / bounds.maxRadius, 1) : 0.5;
        default:
            return 0.5;
    }
}

function fillColors(colors, positions, colorConfig) {
    const count = colors.length / 3;
    
    if (colorConfig.gradientEnabled) {
        const bounds = computeBounds(positions);
        const startColor = new THREE.Color(colorConfig.gradientStart);
        const endColor = new THREE.Color(colorConfig.gradientEnd);
        const direction = colorConfig.gradientDirection || 'horizontal';
        
        for (let i = 0; i < count; i++) {
            const t = getGradientFactor(i * 3, positions, bounds, direction);
            const color = lerpColor(startColor, endColor, t);
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        }
    } else {
        const singleColor = new THREE.Color(colorConfig.singleColor);
        for (let i = 0; i < count; i++) {
            colors[i * 3] = singleColor.r;
            colors[i * 3 + 1] = singleColor.g;
            colors[i * 3 + 2] = singleColor.b;
        }
    }
}

export function createParticleSystem(positions, colorConfig, size = 1) {
    const geometry = new THREE.BufferGeometry();
    const count = positions.length / 3;
    
    const positionAttribute = new THREE.Float32BufferAttribute(positions, 3);
    positionAttribute.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute('position', positionAttribute);
    
    const colors = new Float32Array(count * 3);
    fillColors(colors, positions, colorConfig);
    const colorAttribute = new THREE.BufferAttribute(colors, 3);
    colorAttribute.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute('color', colorAttribute);
    
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
    particles.userData.colorConfig = { ...colorConfig };
    return particles;
}

export function updateParticlePositions(particles, newPositions, colorConfig = null) {
    const geometry = particles.geometry;
    const positionAttribute = geometry.getAttribute('position');
    const colorAttribute = geometry.getAttribute('color');
    
    if (newPositions.length > positionAttribute.array.length) {
        return { needsRecreate: true };
    }
    
    positionAttribute.array.set(newPositions);
    positionAttribute.count = newPositions.length / 3;
    positionAttribute.needsUpdate = true;
    
    if (colorConfig || particles.userData.colorConfig) {
        const config = colorConfig || particles.userData.colorConfig;
        const colors = colorAttribute.array;
        const colorCount = positionAttribute.count * 3;
        fillColors(colors, newPositions, config);
        colorAttribute.count = positionAttribute.count;
        colorAttribute.needsUpdate = true;
        if (colorConfig) {
            particles.userData.colorConfig = { ...colorConfig };
        }
    }
    
    geometry.computeBoundingSphere();
    geometry.computeBoundingBox();
    
    return { needsRecreate: false };
}

export function recreateParticleSystem(scene, oldParticles, newPositions, colorConfig, size) {
    const newParticles = createParticleSystem(newPositions, colorConfig, size);
    
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

export function updateParticleColor(particles, colorConfig) {
    const geometry = particles.geometry;
    const colorAttribute = geometry.getAttribute('color');
    const positionAttribute = geometry.getAttribute('position');
    const positions = positionAttribute.array;
    const colors = colorAttribute.array;
    
    fillColors(colors, positions, colorConfig);
    colorAttribute.needsUpdate = true;
    particles.userData.colorConfig = { ...colorConfig };
}

export function growOrReuseParticleSystem(scene, particles, newPositions, colorConfig, size) {
    if (!particles) {
        const newParticles = createParticleSystem(newPositions, colorConfig, size);
        scene.add(newParticles);
        return newParticles;
    }
    
    const positionAttribute = particles.geometry.getAttribute('position');
    const oldCapacity = positionAttribute.array.length;
    const newLength = newPositions.length;
    
    if (newLength <= oldCapacity) {
        updateParticlePositions(particles, newPositions, colorConfig);
        updateParticleSize(particles, size);
        return particles;
    } else {
        const newCapacity = Math.max(newLength, Math.floor(oldCapacity * 1.5));
        const oldPositions = positionAttribute.array;
        const oldColorAttribute = particles.geometry.getAttribute('color');
        const oldColors = oldColorAttribute.array;
        
        const newPositionArray = new Float32Array(newCapacity);
        const newColorArray = new Float32Array(newCapacity);
        
        newPositionArray.set(oldPositions);
        newColorArray.set(oldColors);
        
        const newPositionAttr = new THREE.BufferAttribute(newPositionArray, 3);
        newPositionAttr.setUsage(THREE.DynamicDrawUsage);
        newPositionAttr.count = newLength / 3;
        
        const newColorAttr = new THREE.BufferAttribute(newColorArray, 3);
        newColorAttr.setUsage(THREE.DynamicDrawUsage);
        newColorAttr.count = newLength / 3;
        
        particles.geometry.dispose();
        const newGeometry = new THREE.BufferGeometry();
        newGeometry.setAttribute('position', newPositionAttr);
        newGeometry.setAttribute('color', newColorAttr);
        
        particles.geometry = newGeometry;
        
        updateParticlePositions(particles, newPositions, colorConfig);
        updateParticleSize(particles, size);
        
        return particles;
    }
}
