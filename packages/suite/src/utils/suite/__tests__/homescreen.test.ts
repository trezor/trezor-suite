import {
    dataUrlToImage,
    fileToArrayBuffer,
    fileToDataUrl,
    isProgressiveJPG,
    isValidImageFormat,
    isValidImageHeight,
    isValidImageSize,
    isValidImageWidth,
} from '@suite-utils/homescreen';
import { DeviceModel } from '@trezor/device-utils';
import * as fixtures from '../__fixtures__/homescreen';

describe('homescreen', () => {
    describe('fileToDataUrl', () => {
        it('should convert a JPG file to a data URL', async () => {
            const jpegFile = new File(['dummy image'], 'test.jpg', { type: 'image/jpeg' });

            const dataUrl = await fileToDataUrl(jpegFile);

            expect(dataUrl.startsWith('data:image/jpeg;base64,')).toBe(true);
        });

        it('should convert a PNG file to a data URL', async () => {
            const pngFile = new File(['dummy image'], 'test.png', { type: 'image/png' });

            const dataUrl = await fileToDataUrl(pngFile);

            expect(dataUrl.startsWith('data:image/png;base64,')).toBe(true);
        });
    });

    describe('fileToArrayBuffer', () => {
        it('should convert a JPG file to an ArrayBuffer', async () => {
            const imageFile = new File(['dummy data'], 'test.jpg', { type: 'image/jpeg' });

            const arrayBuffer = await fileToArrayBuffer(imageFile);

            expect(arrayBuffer).toBeDefined();
            expect(arrayBuffer).not.toBeNull();
            expect(arrayBuffer instanceof ArrayBuffer).toBe(true);
        });
    });

    describe('dataUrlToImage', () => {
        const originalCreateElement = document.createElement;
        beforeAll(() => {
            document.createElement = (create =>
                function () {
                    // @ts-expect-error
                    // eslint-disable-next-line prefer-rest-params
                    const element: HTMLElement = create.apply(this, arguments);

                    if (element.tagName === 'IMG') {
                        setTimeout(() => {
                            // @ts-expect-error
                            element.onload(new Event('load'));
                        }, 100);
                    }
                    return element;
                })(document.createElement);
        });

        afterAll(() => {
            document.createElement = originalCreateElement;
        });

        it('should convert a data URL to an image', async () => {
            // mock image 1x1
            const dataUrl =
                'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z/C/HgAGBQF/yw+3HwAAAABJRU5ErkJggg==';

            const image = await dataUrlToImage(dataUrl);

            expect(image.src).toBe(dataUrl);
        });
    });

    describe('isValidImageFormat', () => {
        fixtures.isValidImageFormat.forEach(fixture => {
            it(fixture.description, () => {
                const result = isValidImageFormat(fixture.dataUrl, fixture.deviceModel);
                expect(result).toBe(fixture.result);
            });
        });
    });

    describe('isValidImageWidth', () => {
        fixtures.isValidImageWidth.forEach(fixture => {
            it(fixture.description, () => {
                const image = new Image();
                image.width = fixture.width;
                const result = isValidImageWidth(image, fixture.deviceModel);
                expect(result).toBe(fixture.result);
            });
        });
    });

    describe('isValidImageHeigh', () => {
        fixtures.isValidImageHeight.forEach(fixture => {
            it(fixture.description, () => {
                const image = new Image();
                image.height = fixture.height;
                const result = isValidImageHeight(image, fixture.deviceModel);
                expect(result).toBe(fixture.result);
            });
        });
    });

    describe('isProgressiveJPG', () => {
        fixtures.isProgressiveJPG.forEach(fixture => {
            it(fixture.description, () => {
                const result = isProgressiveJPG(fixture.buffer, fixture.deviceModel);
                expect(result).toBe(fixture.result);
            });
        });
    });

    describe('isValidImageSize', () => {
        it('should return true for non-TT device models', () => {
            const file = new File([], 'test.png', { type: 'image/png', lastModified: 0 });
            expect(isValidImageSize(file, DeviceModel.TR)).toBe(true);
            expect(isValidImageSize(file, DeviceModel.T1)).toBe(true);
        });

        it('should return true for TT device models when file size is less than or equal to 16384 bytes', () => {
            const file = new File([], 'test.png', {
                type: 'image/png',
                lastModified: 0,
            });
            Object.defineProperty(file, 'size', { value: 16384, configurable: true });

            expect(isValidImageSize(file, DeviceModel.TT)).toBe(true);
        });

        it('should return false for TT device models when file size is greater than 16384 bytes', () => {
            const file = new File([], 'test.png', {
                type: 'image/png',
                lastModified: 0,
            });
            Object.defineProperty(file, 'size', { value: 16385, configurable: true });

            expect(isValidImageSize(file, DeviceModel.TT)).toBe(false);
        });
    });
});
