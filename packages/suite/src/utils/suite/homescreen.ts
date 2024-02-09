import { TrezorDevice } from 'src/types/suite/index';
import { DeviceModelInternal } from '@trezor/connect';
import { deflateRaw } from 'pako';

export const deviceModelInformation = {
    [DeviceModelInternal.T1B1]: { width: 128, height: 64, supports: ['png', 'jpeg'] },
    [DeviceModelInternal.T2T1]: { width: 240, height: 240, supports: ['jpeg'] },
    [DeviceModelInternal.T2B1]: { width: 128, height: 64, supports: ['png', 'jpeg'] },
};

export const enum ImageValidationError {
    InvalidFormatOnlyPngJpg = 'IMAGE_VALIDATION_ERROR_INVALID_FORMAT_ONLY_PNG_JPG',
    InvalidFormatOnlyJpg = 'IMAGE_VALIDATION_ERROR_INVALID_FORMAT_ONLY_JPG',
    InvalidDimensions = 'IMAGE_VALIDATION_ERROR_INVALID_DIMENSIONS',
    InvalidSize = 'IMAGE_VALIDATION_ERROR_INVALID_SIZE',
    ProgressiveJpgFormat = 'IMAGE_VALIDATION_ERROR_PROGRESSIVE_JPG',
    UnexpectedAlpha = 'IMAGE_VALIDATION_ERROR_UNEXPECTED_ALPHA',
    InvalidColorCombination = 'IMAGE_VALIDATION_ERROR_INVALID_COLOR_COMBINATION',
}

const range = (length: number) => [...Array(length).keys()];

export const fileToDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e: ProgressEvent<FileReader>) => resolve(e.target?.result as string);
        reader.onerror = err => reject(err);
        reader.readAsDataURL(file);
    });

export const fileToArrayBuffer = (file: File): Promise<ArrayBuffer> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e: ProgressEvent<FileReader>) => resolve(e.target?.result as ArrayBuffer);
        reader.onerror = err => reject(err);
        reader.readAsArrayBuffer(file);
    });

export const dataUrlToImage = (dataUrl: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const image = new Image();

        image.onload = () => resolve(image);
        image.onerror = e => reject(e);
        image.src = dataUrl;
    });

const imageToCanvas = (image: HTMLImageElement, deviceModelInternal: DeviceModelInternal) => {
    const { width, height } = deviceModelInformation[deviceModelInternal];

    const canvas = document.createElement('canvas');
    canvas.height = height;
    canvas.width = width;

    const ctx = canvas.getContext('2d');
    if (ctx == null) {
        throw new Error('2D context is null');
    }

    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(image, 0, 0);

    return { canvas, ctx };
};

const bitmap = (imageData: ImageData, deviceModelInternal: DeviceModelInternal) => {
    const { width, height } = deviceModelInformation[deviceModelInternal];

    const homescreen = range(height)
        .map(j =>
            range(width / 8)
                .map(i => {
                    const bytestr = range(8)
                        .map(k => (j * width + i * 8 + k) * 4)
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

// Convert RGB to grayscale using the formula grayscale = 0.299 * R + 0.587 * G + 0.114 * B
const toGrayscale = (red: number, green: number, blue: number): number =>
    Math.round(0.299 * red + 0.587 * green + 0.114 * blue);

// TOIG
const toig = (imageData: ImageData, deviceModelInternal: DeviceModelInternal) => {
    const { width, height } = deviceModelInformation[deviceModelInternal];

    const pixels = range(height)
        .map(row =>
            range(width).map(col => {
                const i = row * width + col;
                const r = imageData.data[4 * i];
                const g = imageData.data[4 * i + 1];
                const b = imageData.data[4 * i + 2];
                return toGrayscale(r, g, b);
            }),
        )
        .flat();

    // Pack two grayscale pixels into one byte (each pixel is 4 bits)
    const bytes = [];
    for (let i = 0; i < pixels.length; i += 2) {
        const even = pixels[i];
        const odd = pixels[i + 1];

        // Use the even pixel for the higher 4 bits and odd pixel for the lower 4 bits.
        const packedByte = ((even & 0xf0) >> 4) | (odd & 0xf0);
        bytes.push(packedByte);
    }

    const packed = deflateRaw(Uint8Array.from(bytes), {
        level: 9,
        windowBits: 10,
    });

    // https://github.com/trezor/trezor-firmware/blob/master/docs/misc/toif.md
    let header = '544f4947'; // 'TOIG' (indicating grayscale mode)
    header += rightPad(4, width.toString(16));
    header += rightPad(4, height.toString(16));
    let length = Number(packed.length).toString(16);
    if (length.length % 2 > 0) {
        length = evenPad(length);
    }
    length = chunkString(2, length).reverse().join('');
    header += rightPad(8, length);

    return header + byteArrayToHexString(packed);
};

export const imageToImageData = (
    image: HTMLImageElement,
    deviceModelInternal: DeviceModelInternal,
) => {
    const { width, height } = deviceModelInformation[deviceModelInternal];

    const { ctx } = imageToCanvas(image, deviceModelInternal);

    // no quality param as it resize image
    return ctx.getImageData(0, 0, width, height);
};

export const isValidImageFormat = (dataUrl: string, deviceModelInternal: DeviceModelInternal) => {
    const supportedFormats = deviceModelInformation[deviceModelInternal].supports.join('|');
    const supportedDataUrlRE = new RegExp(`data:image/(${supportedFormats})`);

    return !!dataUrl && supportedDataUrlRE.test(dataUrl);
};

export const isValidImageWidth = (
    image: HTMLImageElement,
    deviceModelInternal: DeviceModelInternal,
) => {
    const { width } = deviceModelInformation[deviceModelInternal];

    return image.width === width;
};

export const isValidImageHeight = (
    image: HTMLImageElement,
    deviceModelInternal: DeviceModelInternal,
) => {
    const { height } = deviceModelInformation[deviceModelInternal];

    return image.height === height;
};

export const isProgressiveJPG = (buffer: ArrayBuffer, deviceModelInternal: DeviceModelInternal) => {
    if (deviceModelInternal !== DeviceModelInternal.T2T1) {
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

export const isValidImageSize = (file: File, deviceModelInternal: DeviceModelInternal) => {
    if (deviceModelInternal !== DeviceModelInternal.T2T1) {
        return true;
    }

    return file.size <= 16384;
};

export const validateImageColors = (
    origImage: HTMLImageElement,
    deviceModelInternal: DeviceModelInternal,
) => {
    const imageData = imageToImageData(origImage, deviceModelInternal);

    if ([DeviceModelInternal.T1B1, DeviceModelInternal.T2B1].includes(deviceModelInternal)) {
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

export const validateImage = async (file: File, deviceModelInternal: DeviceModelInternal) => {
    const dataUrl = await fileToDataUrl(file);
    const arrayBuffer = await fileToArrayBuffer(file);
    const image = await dataUrlToImage(dataUrl);

    if (!isValidImageFormat(dataUrl, deviceModelInternal)) {
        const { supports } = deviceModelInformation[deviceModelInternal];

        if (supports.includes('png') && supports.includes('jpeg')) {
            return ImageValidationError.InvalidFormatOnlyPngJpg;
        }
        return ImageValidationError.InvalidFormatOnlyJpg;
    }
    if (
        !isValidImageWidth(image, deviceModelInternal) ||
        !isValidImageHeight(image, deviceModelInternal)
    ) {
        return ImageValidationError.InvalidDimensions;
    }
    if (isProgressiveJPG(arrayBuffer, deviceModelInternal)) {
        return ImageValidationError.ProgressiveJpgFormat;
    }
    if (!isValidImageSize(file, deviceModelInternal)) {
        return ImageValidationError.InvalidSize;
    }

    const imageColorsError = validateImageColors(image, deviceModelInternal);

    return imageColorsError || undefined;
};

export const imagePathToHex = async (
    imagePath: string,
    deviceModelInternal: DeviceModelInternal,
) => {
    const response = await fetch(imagePath);

    // image can be loaded to device without modifications -> it is in original quality
    if (deviceModelInternal === DeviceModelInternal.T2T1) {
        const arrayBuffer = await response.arrayBuffer();

        return Buffer.from(arrayBuffer).toString('hex');
    }

    /* 
    - However, this method accepts the Canvas format which changes the quality of image
    */
    const blob = await response.blob();

    const element = await dataUrlToImage(URL.createObjectURL(blob));

    const { canvas, ctx } = imageToCanvas(element, deviceModelInternal);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    if (deviceModelInternal === DeviceModelInternal.T2B1) {
        return toig(imageData, deviceModelInternal);
    }

    // DeviceModelInternal.T1B1
    return bitmap(imageData, deviceModelInternal);
};

export const isHomescreenSupportedOnDevice = (device: TrezorDevice) => {
    const deviceModelInternal = device.features?.internal_model;

    return (
        deviceModelInternal !== DeviceModelInternal.T2T1 ||
        (deviceModelInternal === DeviceModelInternal.T2T1 && device.features?.homescreen_format)
    );
};
