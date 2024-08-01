import { getDominantColor } from '../src/utils/getDominantColor';

describe('getDominantColor', () => {
    const createImageData = (
        data: number[],
        width: number,
        height: number,
        colorSpace?: PredefinedColorSpace,
    ): ImageData => ({
        data: new Uint8ClampedArray(data),
        width,
        height,
        colorSpace: colorSpace || 'srgb',
    });

    it('should return the correct dominant - red color in hexadecimal format', () => {
        const imageData = createImageData(
            [
                // Red
                255, 0, 0, 255,
                // Red
                255, 0, 0, 255,
                // Green
                0, 255, 0, 255,
                // Blue, with transparency
                0, 0, 255, 0,
                // Blue, with transparency
                0, 0, 255, 100,
                // Blue, with transparency
                0, 0, 255, 200,
            ],
            3,
            2,
        );

        const dominantColor = getDominantColor(imageData);
        expect(dominantColor).toBe('#ff0000'); // Red
    });

    it('should handle empty image data gracefully', () => {
        const imageData = createImageData([], 0, 0);

        const dominantColor = getDominantColor(imageData);
        expect(dominantColor).toBe(undefined);
    });

    it('should handle equal color distribution', () => {
        const imageData = createImageData(
            [
                // Red
                255, 0, 0, 255,
                // Green
                0, 255, 0, 255,
                // Blue
                0, 0, 255, 255,
                // Red
                255, 0, 0, 255,
                // Green
                0, 255, 0, 255,
                // Blue
                0, 0, 255, 255,
            ],
            3,
            2,
        );

        const dominantColor = getDominantColor(imageData);
        expect(dominantColor).toBe('#ff0000'); // Assuming red as the first dominant color
    });
});
