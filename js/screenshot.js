export function takeScreenshot(renderer) {
    return new Promise((resolve, reject) => {
        try {
            renderer.domElement.toBlob((blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('Failed to create blob'));
                }
            }, 'image/png');
        } catch (error) {
            reject(error);
        }
    });
}

export function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

export function generateFilename() {
    const now = new Date();
    const timestamp = now.getFullYear().toString() +
        (now.getMonth() + 1).toString().padStart(2, '0') +
        now.getDate().toString().padStart(2, '0') +
        now.getHours().toString().padStart(2, '0') +
        now.getMinutes().toString().padStart(2, '0') +
        now.getSeconds().toString().padStart(2, '0');
    return `particle-text-${timestamp}.png`;
}

export async function captureAndDownload(renderer) {
    try {
        const blob = await takeScreenshot(renderer);
        const filename = generateFilename();
        downloadBlob(blob, filename);
        return true;
    } catch (error) {
        console.error('Screenshot failed:', error);
        return false;
    }
}
