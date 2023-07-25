/* eslint-disable no-bitwise */
import { TrezorDevice } from 'src/types/suite/index';
import { DeviceModel, getDeviceModel } from '@trezor/device-utils';

export const deviceModelInformation = {
    [DeviceModel.T1]: { width: 128, height: 64, supports: ['png', 'jpeg'] },
    [DeviceModel.TT]: { width: 240, height: 240, supports: ['jpeg'] },
    [DeviceModel.T2B1]: { width: 128, height: 64, supports: ['png', 'jpeg'] },
    [DeviceModel.UNKNOWN]: { width: 0, height: 0, supports: [] as string[] },
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

const imageToCanvas = (image: HTMLImageElement, deviceModel: DeviceModel) => {
    const { width, height } = deviceModelInformation[deviceModel];

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

const toig = (imageData: ImageData, deviceModel: DeviceModel) => {
    const { width, height } = deviceModelInformation[deviceModel];

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

export const imageToImageData = (image: HTMLImageElement, deviceModel: DeviceModel) => {
    const { width, height } = deviceModelInformation[deviceModel];

    const { ctx } = imageToCanvas(image, deviceModel);

    // no quality param as it resize image
    return ctx.getImageData(0, 0, width, height);
};

export const isValidImageFormat = (dataUrl: string, deviceModel: DeviceModel) => {
    const supportedFormats = deviceModelInformation[deviceModel].supports.join('|');
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

export const isProgressiveJPG = (buffer: ArrayBuffer, deviceModel: DeviceModel) => {
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

export const isValidImageSize = (file: File, deviceModel: DeviceModel) => {
    if (deviceModel !== DeviceModel.TT) {
        return true;
    }

    return file.size <= 16384;
};

export const validateImageColors = (origImage: HTMLImageElement, deviceModel: DeviceModel) => {
    const imageData = imageToImageData(origImage, deviceModel);

    if ([DeviceModel.T1, DeviceModel.T2B1].includes(deviceModel)) {
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

        if (supports.includes('png') && supports.includes('jpeg')) {
            return ImageValidationError.InvalidFormatOnlyPngJpg;
        }
        return ImageValidationError.InvalidFormatOnlyJpg;
    }
    if (!isValidImageWidth(image, deviceModel) || !isValidImageHeight(image, deviceModel)) {
        return ImageValidationError.InvalidDimensions;
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
    const response = await fetch(imagePath);

    // image can be loaded to device without modifications -> it is in original quality
    if (deviceModel === DeviceModel.TT) {
        const arrayBuffer = await response.arrayBuffer();

        return Buffer.from(arrayBuffer).toString('hex');
    }

    /* 
    - Image has to be modified by 'toig' method
    - However, this method accepts the Canvas format which changes the quality of image
    */
    const blob = await response.blob();

    const element = await dataUrlToImage(URL.createObjectURL(blob));

    const { canvas, ctx } = imageToCanvas(element, deviceModel);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    return toig(imageData, deviceModel);
};

export const isHomescreenSupportedOnDevice = (device: TrezorDevice) => {
    const deviceModel = getDeviceModel(device);

    return (
        deviceModel !== DeviceModel.TT ||
        (deviceModel === DeviceModel.TT && device.features?.homescreen_format)
    );
};
