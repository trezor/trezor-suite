import { deviceModelInformation } from 'src/utils/suite/homescreen';
import { DeviceModelInternal } from '@trezor/connect';

export const isValidImageFormat = [
    {
        description: 'valid image format for T2T1',
        dataUrl: 'data:image/jpeg;base64,1234567890',
        deviceModelInternal: DeviceModelInternal.T2T1,
        result: true,
    },
    {
        description: 'invalid image format for T2T1',
        dataUrl: 'data:image/png;base64,1234567890',
        deviceModelInternal: DeviceModelInternal.T2T1,
        result: false,
    },
    {
        description: 'no image format for T2T1',
        dataUrl: '',
        deviceModelInternal: DeviceModelInternal.T2T1,
        result: false,
    },
    {
        description: 'valid JPG image format for T1B1',
        dataUrl: 'data:image/jpeg;base64,1234567890',
        deviceModelInternal: DeviceModelInternal.T1B1,
        result: true,
    },
    {
        description: 'valid PNG image format for T1B1',
        dataUrl: 'data:image/png;base64,1234567890',
        deviceModelInternal: DeviceModelInternal.T1B1,
        result: true,
    },
    {
        description: 'no image format for T1B1',
        dataUrl: '',
        deviceModelInternal: DeviceModelInternal.T1B1,
        result: false,
    },
];

export const isValidImageWidth = [
    {
        description: 'valid image width for T2T1',
        deviceModelInternal: DeviceModelInternal.T2T1,
        width: deviceModelInformation[DeviceModelInternal.T2T1].width,
        result: true,
    },
    {
        description: 'invalid image width for T2T1, too small',
        deviceModelInternal: DeviceModelInternal.T2T1,
        width: deviceModelInformation[DeviceModelInternal.T2T1].width + 1,
        result: false,
    },
    {
        description: 'invalid image width for T2T1, too big',
        deviceModelInternal: DeviceModelInternal.T2T1,
        width: deviceModelInformation[DeviceModelInternal.T2T1].width - 1,
        result: false,
    },
];

export const isValidImageHeight = [
    {
        description: 'valid image height for T2T1',
        deviceModelInternal: DeviceModelInternal.T2T1,
        height: deviceModelInformation[DeviceModelInternal.T2T1].height,
        result: true,
    },
    {
        description: 'invalid image height for T2T1, too big',
        deviceModelInternal: DeviceModelInternal.T2T1,
        height: deviceModelInformation[DeviceModelInternal.T2T1].height + 1,
        result: false,
    },
    {
        description: 'invalid image height for T2T1, too small',
        deviceModelInternal: DeviceModelInternal.T2T1,
        height: deviceModelInformation[DeviceModelInternal.T2T1].height - 1,
        result: false,
    },
];

export const isProgressiveJPG = [
    {
        description: 'progressive image for T2T1',
        deviceModelInternal: DeviceModelInternal.T2T1,
        buffer: new Uint8Array([0xff, 0xc2, 0x00, 0x0b, 0x08, 0x00, 0x00, 0x03, 0x01, 0x22, 0x00]),
        result: true,
    },
    {
        description: 'non-progressive image for T2T1',
        deviceModelInternal: DeviceModelInternal.T2T1,
        buffer: new Uint8Array([0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x00, 0x03, 0x01, 0x22, 0x00]),
        result: false,
    },
    {
        description: 'progressive image for T1B1',
        deviceModelInternal: DeviceModelInternal.T1B1,
        buffer: new Uint8Array([0xff, 0xc2, 0x00, 0x0b, 0x08, 0x00, 0x00, 0x03, 0x01, 0x22, 0x00]),
        result: false,
    },
];
