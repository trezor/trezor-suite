import { PartialDevice } from './types';

export const isDeviceInBootloaderMode = (device?: PartialDevice) =>
    !!device?.features?.bootloader_mode;
