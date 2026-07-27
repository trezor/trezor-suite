import { BrowserQRCodeReader } from '@zxing/library';

const reader = new BrowserQRCodeReader();

export const decodeQRFromImage = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);

        reader
            .decodeFromImageUrl(url)
            .then(result => resolve(result.getText()))
            .catch(() => reject(new Error('QR code not found in image')))
            .finally(() => URL.revokeObjectURL(url));
    });
