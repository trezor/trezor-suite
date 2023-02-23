/* eslint-disable no-bitwise */
import { DeviceModel } from '@trezor/device-utils';
import * as pako from 'pako';

export const deviceModelInformation = {
    [DeviceModel.T1]: { width: 128, height: 64, supports: ['.png', '.jpeg'] },
    [DeviceModel.TT]: { width: 240, height: 240, supports: ['.jpeg'] },
    [DeviceModel.TR]: { width: 128, height: 64, supports: ['.png', '.jpeg'] },
    [DeviceModel.UNKNOWN]: { width: 0, height: 0, supports: [] as string[] },
};

export const enum ImageValidationError {
    InvalidFormatOnlyPngJpg = 'IMAGE_VALIDATION_ERROR_INVALID_FORMAT_ONLY_PNG_JPG',
    InvalidFormatOnlyJpg = 'IMAGE_VALIDATION_ERROR_INVALID_FORMAT_ONLY_JPG',
    InvalidHeight = 'IMAGE_VALIDATION_ERROR_INVALID_HEIGHT',
    InvalidWidth = 'IMAGE_VALIDATION_ERROR_INVALID_WIDTH',
    InvalidSize = 'IMAGE_VALIDATION_ERROR_INVALID_SIZE',
    ProgressiveJpgFormat = 'IMAGE_VALIDATION_ERROR_PROGRESSIVE_JPG',
    UnexpectedAlpha = 'IMAGE_VALIDATION_ERROR_UNEXPECTED_ALPHA',
    InvalidColorCombination = 'IMAGE_VALIDATION_ERROR_INVALID_COLOR_COMBINATION',
}

const range = (length: number) => [...Array(length).keys()];

const byteArrayToHexString = (byteArray: Uint8Array) =>
    Array.from(byteArray, byte => `0${(byte & 0xff).toString(16)}`.slice(-2)).join('');

const rightPad = (len: number, val: string) => {
    while (val.length < len) {
        val = `${val}0`;
    }
    return val;
};

const evenPad = (val: string) => {
    if (val.length % 2 === 0) return val;
    return `0${val}`;
};

const chunkString = (size: number, str: string) => {
    const re = new RegExp(`.{1,${size}}`, 'g');
    const result = str.match(re);
    if (!result) return [];
    return result;
};

const getCanvas = () => {
    const canvas = document.getElementById(canvasId);
    if (canvas != null && canvas instanceof HTMLCanvasElement) {
        return canvas;
    }
    const newCanvas = document.createElement('canvas');
    newCanvas.id = canvasId;
    newCanvas.style.visibility = 'hidden';
    newCanvas.style.position = 'absolute';
    newCanvas.style.height = '0';
    const { body } = document;
    if (body == null) {
        throw new Error('document.body is null');
    }
    body.appendChild(newCanvas);
    return newCanvas;
};

const removeCanvas = () => {
    const el = document.getElementById(canvasId);
    if (el) {
        el.remove();
    }
};

// assuming max = x = y here
const isOutsideCircle = (max: number, row: number, col: number) => {
    const half = max / 2;
    const dx = col - half;
    const dy = row - half;
    return Math.sqrt(dx ** 2 + dy ** 2) >= half;
};

const toig = (w: number, h: number, imageData: ImageData) => {
    const homescreen = range(h)
        .map(j =>
            range(w / 8)
                .map(i => {
                    const bytestr = range(8)
                        .map(k => (j * w + i * 8 + k) * 4)
                        .map(index => (imageData.data[index] === 0 ? '0' : '1'))
                        .join('');
                    return String.fromCharCode(parseInt(bytestr, 2));
                })
                .join(''),
        )
        .join('');
    const hex = homescreen
        .split('')
        .map(letter => letter.charCodeAt(0))
        .map(charCode => charCode & 0xff)
        .map(charCode => charCode.toString(16))
        .map(chr => (chr.length < 2 ? `0${chr}` : chr))
        .join('');
    return hex;
};

const toif = (w: number, h: number, imageData: ImageData) => {
    // flat does [[1, 2], [3, 4]] -> [1, 2, 3, 4] here
    const pixels = range(h)
        .map(row =>
            range(w).map(col => {
                const i = row * w + col;
                // draw black outside the visible area for smaller image size
                if (isOutsideCircle(w, row, col)) {
                    return 0;
                }
                const r = imageData.data[4 * i];
                const g = imageData.data[4 * i + 1];
                const b = imageData.data[4 * i + 2];
                return ((r & 0xf8) << 8) | ((g & 0xfc) << 3) | ((b & 0xf8) >> 3);
            }),
        )
        .flat();

    // Uint16Array -> Uint8Array
    const bytes = pixels.map((p: number) => [Math.floor(p / 256), p % 256]).flat();

    const packed = pako.deflateRaw(bytes, {
        level: 9,
        windowBits: 10,
    });

    // TOIf
    let header = '544f4966';
    // width
    header += '9000';
    // height
    header += '9000';
    let length = Number(packed.length).toString(16);
    if (length.length % 2 > 0) {
        length = evenPad(length);
    }
    length = chunkString(2, length).reverse().join('');
    header += rightPad(8, length);

    return header + byteArrayToHexString(packed);
};

export const fileToDataUrl = (file: File): Promise<string> => {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
        reader.onload = e =>
            // @ts-expect-error
            resolve(e.target.result);
        reader.onerror = err => {
            reject(err);
        };
        reader.readAsDataURL(file);
    });
};

const dataUrlToImage = (dataUrl: string): Promise<HTMLImageElement> => {
    const image = new Image();
    return new Promise((resolve, reject) => {
        image.onload = () => {
            resolve(image);
        };
        image.onerror = e => {
            reject(e);
        };
        image.src = dataUrl;
    });
};

export const elementToImageData = (element: HTMLImageElement, width: number, height: number) => {
    const canvas = getCanvas();
    const ctx = canvas.getContext('2d');
    if (ctx == null) {
        throw new Error('2D context is null');
    }
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(element, 0, 0);

    const imageData = ctx.getImageData(0, 0, width, height);
    return imageData;
};

export const isValidImageFormat = (dataUrl: string, deviceModel: DeviceModel) => {
    const supportedFormats = deviceModelInformation[deviceModel].supports
        .join('|')
        .replaceAll('.', '');
    const supportedDataUrlRE = new RegExp(`data:image/(${supportedFormats})`);

    return !!dataUrl && supportedDataUrlRE.test(dataUrl);
};

export const isValidImageWidth = (image: HTMLImageElement, deviceModel: DeviceModel) => {
    const { width } = deviceModelInformation[deviceModel];

    return image.width === width;
};

export const isValidImageHeight = (image: HTMLImageElement, deviceModel: DeviceModel) => {
    const { height } = deviceModelInformation[deviceModel];

    return image.height === height;
};

const isProgressiveJPEG = (buffer: ArrayBuffer, deviceModel: DeviceModel) => {
    if (deviceModel !== DeviceModel.TT) {
        return false;
    }

    const data = new Uint8Array(buffer);

    for (let i = 0; i < data.length - 1; i++) {
        if (data[i] === 0xff && data[i + 1] === 0xc2) {
            return true;
        }
    }

    return false;
};

const isValidImageSize = (file: File, deviceModel: DeviceModel) => {
    if (deviceModel !== DeviceModel.TT) {
        return true;
    }

    return file.size <= 16384;
};

export const validateImageColors = (origImage: HTMLImageElement, deviceModel: DeviceModel) => {
    const { width, height } = deviceModelInformation[deviceModel];
    const imageData = imageToImageData(origImage, width, height);

    if ([DeviceModel.T1, DeviceModel.TR].includes(deviceModel)) {
        try {
            range(imageData.height).forEach((j: number) => {
                range(imageData.width).forEach(i => {
                    const index = j * 4 * imageData.width + i * 4;
                    const red = imageData.data[index];
                    const green = imageData.data[index + 1];
                    const blue = imageData.data[index + 2];
                    const alpha = imageData.data[index + 3];
                    if (alpha !== 255) {
                        throw new Error(ImageValidationError.UnexpectedAlpha);
                    }
                    const isBlack = red === 0 && green === 0 && blue === 0;
                    const isWhite = red === 255 && green === 255 && blue === 255;

                    if (!isBlack && !isWhite) {
                        throw new Error(ImageValidationError.InvalidColorCombination);
                    }
                });
            });
        } catch (error) {
            return error.message;
        }
    }
};

export const validateImage = async (file: File, deviceModel: DeviceModel) => {
    const dataUrl = await fileToDataUrl(file);
    const arrayBuffer = await fileToArrayBuffer(file);
    const image = await dataUrlToImage(dataUrl);

    if (!isValidImageFormat(dataUrl, deviceModel)) {
        const { supports } = deviceModelInformation[deviceModel];

        if (supports.includes('.png') && supports.includes('.jpeg')) {
            return ImageValidationError.InvalidFormatOnlyPngJpg;
        }
        return ImageValidationError.InvalidFormatOnlyJpg;
    }
    if (!isValidImageWidth(image, deviceModel)) {
        return ImageValidationError.InvalidWidth;
    }
    if (!isValidImageHeight(image, deviceModel)) {
        return ImageValidationError.InvalidHeight;
    }
    if (isProgressiveJPG(arrayBuffer, deviceModel)) {
        return ImageValidationError.ProgressiveJpgFormat;
    }
    if (!isValidImageSize(file, deviceModel)) {
        return ImageValidationError.InvalidSize;
    }

    const imageColorsError = validateImageColors(image, deviceModel);

    return imageColorsError || undefined;
};

export const imagePathToHex = async (imagePath: string, deviceModel: DeviceModel) => {
    const { width, height } = deviceModelInformation[deviceModel];

    const response = await fetch(imagePath);

    let hex;
    if (deviceModel === DeviceModel.TT) {
        // original quality
        const arrayBuffer = await response.arrayBuffer();

        hex = Buffer.from(arrayBuffer).toString('hex');
    } else {
        // decreased quality
        const blob = await response.blob();

        const element = await dataUrlToImage(URL.createObjectURL(blob));

        const { canvas, ctx } = imageToCanvas(element, width, height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        hex = toig(width, height, imageData);
    }

    return hex;
};

export const elementToHomescreen = (
    element: HTMLImageElement,
    deviceModel: DeviceModel,
    customElToDataFn?: typeof elementToImageData | undefined,
) => {
    // customElToDataFn needed for injecting mocked elementToImageData function in jest tests
    const { width, height } = deviceModelDimensions[deviceModel];

    const imageData = customElToDataFn
        ? customElToDataFn(element, width, height)
        : elementToImageData(element, width, height);
    const hex = imageDataToHex(imageData, deviceModel);
    removeCanvas();
    return hex;
};

export const getImageResolution = (url: string): Promise<{ width: number; height: number }> =>
    new Promise(resolve => {
        const img = new Image();
        img.src = url;
        img.onload = () =>
            resolve({
                width: img.width,
                height: img.height,
            });
    });

export const getDeviceModelImageType = (deviceModel: DeviceModel) => {
    if ([DeviceModel.T1, DeviceModel.TR].includes(deviceModel)) {
        return `BW_64x128`;
    }

    return `COLOR_128x128`;
};
