export function textToParticlePositions(text, fontSize = 100, particleSpacing = 2, diffusion = 1.0) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const fontFamily = 'Arial Black, Arial, sans-serif';
    ctx.font = `bold ${fontSize}px ${fontFamily}`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    
    const textMetrics = ctx.measureText(text);
    const textWidth = textMetrics.width;
    const textHeight = fontSize * 1.5;
    
    canvas.width = textWidth + 40;
    canvas.height = textHeight + 40;
    
    const canvasCtx = canvas.getContext('2d');
    canvasCtx.fillStyle = '#000000';
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
    
    canvasCtx.font = `bold ${fontSize}px ${fontFamily}`;
    canvasCtx.fillStyle = '#ffffff';
    canvasCtx.textBaseline = 'middle';
    canvasCtx.textAlign = 'center';
    canvasCtx.fillText(text, canvas.width / 2, canvas.height / 2);
    
    const imageData = canvasCtx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    
    const positions = [];
    const scale = 0.5;
    const baseJitter = 5;
    const jitterAmount = baseJitter * diffusion;
    
    for (let y = 0; y < canvas.height; y += particleSpacing) {
        for (let x = 0; x < canvas.width; x += particleSpacing) {
            const index = (y * canvas.width + x) * 4;
            const brightness = pixels[index];
            
            if (brightness > 128) {
                const px = (x - canvas.width / 2) * scale + (Math.random() - 0.5) * jitterAmount;
                const py = (canvas.height / 2 - y) * scale + (Math.random() - 0.5) * jitterAmount;
                const pz = (Math.random() - 0.5) * 5 * (0.5 + diffusion);
                
                positions.push(px, py, pz);
            }
        }
    }
    
    return positions;
}
