import { type TranslationKey } from '@suite/intl';
import { type DeviceModelInternal } from '@trezor/device-utils';

const howToGetFromBootloaderInstructionsMap: Record<DeviceModelInternal, TranslationKey | null> = {
    T1B1: 'TR_DEVICE_CONNECTED_BOOTLOADER_RECONNECT_IN_NORMAL_NO_BUTTON',
    T2B1: 'TR_DEVICE_CONNECTED_BOOTLOADER_RECONNECT_IN_NORMAL_NO_BUTTON',
    T2T1: 'TR_DEVICE_CONNECTED_BOOTLOADER_RECONNECT_IN_NORMAL_NO_TOUCH',
    T3B1: 'TR_DEVICE_CONNECTED_BOOTLOADER_RECONNECT_IN_NORMAL_NO_BUTTON',
    T3T1: 'TR_DEVICE_CONNECTED_BOOTLOADER_RECONNECT_IN_NORMAL_NO_TOUCH',
    T3W1: 'TR_DEVICE_CONNECTED_BOOTLOADER_RESTART_FROM_MENU',
    UNKNOWN: null,
};

type GetHowToGetFromBootloaderInstructionsMapParams = {
    deviceModelInternal: DeviceModelInternal | undefined;
};

export const getHowToGetFromBootloaderInstructionsMap = ({
    deviceModelInternal,
}: GetHowToGetFromBootloaderInstructionsMapParams): TranslationKey | null => {
    if (deviceModelInternal === undefined) {
        return null;
    }

    return howToGetFromBootloaderInstructionsMap[deviceModelInternal];
};
