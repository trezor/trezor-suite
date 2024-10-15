import { PartialDevice } from './types';

export const isDeviceInBootloaderMode = (device?: PartialDevice) =>
    !!device?.features?.bootloader_mode;

export const getDeviceMode = (device?: PartialDevice) => {
    if (device?.features?.bootloader_mode) return 'bootloader';
    if (!device?.features?.initialized) return 'initialize';
    if (device?.features?.no_backup) return 'seedless';

    return 'normal';
};
