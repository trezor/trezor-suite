import { deviceModelInformation } from '@suite-utils/homescreen';
import { DeviceModel } from '@trezor/device-utils';

export const isValidImageFormat = [
    {
        description: 'valid image format for model T',
        dataUrl: 'data:image/jpeg;base64,1234567890',
        deviceModel: DeviceModel.TT,
        result: true,
    },
    {
        description: 'invalid image format for model T',
        dataUrl: 'data:image/png;base64,1234567890',
        deviceModel: DeviceModel.TT,
        result: false,
    },
    {
        description: 'no image format for model T',
        dataUrl: '',
        deviceModel: DeviceModel.TT,
        result: false,
    },
    {
        description: 'valid JPG image format for model 1',
        dataUrl: 'data:image/jpeg;base64,1234567890',
        deviceModel: DeviceModel.T1,
        result: true,
    },
    {
        description: 'valid PNG image format for model 1',
        dataUrl: 'data:image/png;base64,1234567890',
        deviceModel: DeviceModel.T1,
        result: true,
    },
    {
        description: 'no image format for model 1',
        dataUrl: '',
        deviceModel: DeviceModel.T1,
        result: false,
    },
];

export const isValidImageWidth = [
    {
        description: 'valid image width for model T',
        deviceModel: DeviceModel.TT,
        width: deviceModelInformation[DeviceModel.TT].width,
        result: true,
    },
    {
        description: 'invalid image width for model T, too small',
        deviceModel: DeviceModel.TT,
        width: deviceModelInformation[DeviceModel.TT].width + 1,
        result: false,
    },
    {
        description: 'invalid image width for model T, too big',
        deviceModel: DeviceModel.TT,
        width: deviceModelInformation[DeviceModel.TT].width - 1,
        result: false,
    },
];

export const isValidImageHeight = [
    {
        description: 'valid image height for model T',
        deviceModel: DeviceModel.TT,
        height: deviceModelInformation[DeviceModel.TT].height,
        result: true,
    },
    {
        description: 'invalid image height for model T, too big',
        deviceModel: DeviceModel.TT,
        height: deviceModelInformation[DeviceModel.TT].height + 1,
        result: false,
    },
    {
        description: 'invalid image height for model T, too small',
        deviceModel: DeviceModel.TT,
        height: deviceModelInformation[DeviceModel.TT].height - 1,
        result: false,
    },
];

export const isProgressiveJPG = [
    {
        description: 'progressive image for model T',
        deviceModel: DeviceModel.TT,
        buffer: new Uint8Array([0xff, 0xc2, 0x00, 0x0b, 0x08, 0x00, 0x00, 0x03, 0x01, 0x22, 0x00]),
        result: true,
    },
    {
        description: 'non-progressive image for model T',
        deviceModel: DeviceModel.TT,
        buffer: new Uint8Array([0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x00, 0x03, 0x01, 0x22, 0x00]),
        result: false,
    },
    {
        description: 'progressive image for model 1',
        deviceModel: DeviceModel.T1,
        buffer: new Uint8Array([0xff, 0xc2, 0x00, 0x0b, 0x08, 0x00, 0x00, 0x03, 0x01, 0x22, 0x00]),
        result: false,
    },
];
