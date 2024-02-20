import { Device } from '@trezor/connect';

export const isDeviceInBootloaderMode = (device?: Device) => !!device?.features?.bootloader_mode;

export const getDeviceMode = (device?: Device) => {
    if (device?.features?.bootloader_mode) return 'bootloader';
    if (!device?.features?.initialized) return 'initialize';
    if (device?.features?.no_backup) return 'seedless';

    return 'normal';
};
