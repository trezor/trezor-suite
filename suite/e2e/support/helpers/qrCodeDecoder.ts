import { readBarcodes } from 'zxing-wasm/reader';

export const decodeQrCodes = async (screenshot: Buffer) => {
    const results = await readBarcodes(screenshot, {
        formats: ['QRCode'],
        // Conditional handling of dark theme.
        tryInvert: true,
    });

    return results.filter(({ isValid }) => isValid).map(({ text }) => text);
};
