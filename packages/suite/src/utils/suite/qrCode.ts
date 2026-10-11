import decodeQR from 'qr/decode.js';

const getImageData = async (file: File) => {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext('2d');

    if (!context) {
        bitmap.close();
        throw new Error('Canvas 2D context is not available');
    }

    context.drawImage(bitmap, 0, 0);
    bitmap.close();

    return context.getImageData(0, 0, canvas.width, canvas.height);
};

export const decodeQRFromImage = async (file: File): Promise<string> => {
    try {
        return decodeQR(await getImageData(file));
    } catch {
        throw new Error('QR code not found in image');
    }
};
