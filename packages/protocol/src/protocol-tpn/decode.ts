import { PROTOCOL_MALFORMED, PROTOCOL_MISSMATCH_VERSION } from '../errors';
import { MESSAGE_LENGTH, TPN_VERSION } from './constants';

export enum Version {
    v1 = 1,
}

// https://github.com/trezor/trezor-firmware/blob/a779f46b0eb5bf19e7d0594cd618f981a2791022/core/embed/sys/notify/inc/sys/notify.h#L41
export enum TrezorPushNotificationType {
    BOOT = 0 /**< Device boot/startup notification */,
    UNLOCK = 1 /**< Device unlocked and ready to accept messages */,
    LOCK = 2 /**< Device hard-locked and won't accept messages */,
    DISCONNECT = 3 /**< User-initiated disconnect from host */,
    SETTING_CHANGE = 4 /**< Change of settings */,
    SOFTLOCK = 5 /**< Device soft-locked (e.g., after clicking power button) */,
    SOFTUNLOCK = 6 /**< Device soft-unlocked (e.g., after successful pin entry) */,
    PIN_CHANGE = 7 /**< Pin changed on the device */,
    WIPE = 8 /**< Factory reset (wipe) invoked */,
    UNPAIR = 9 /**< BLE bonding for current connection deleted */,
}

export enum TrezorPushNotificationMode {
    NormalMode = 0,
    BootloaderMode = 1,
}

export interface DecodedTrezorPushNotification {
    type: TrezorPushNotificationType;
    mode: TrezorPushNotificationMode;
}

export const decode = (message: number[]): DecodedTrezorPushNotification => {
    const [version, type, mode] = message;
    if (!version || version !== TPN_VERSION) {
        throw new Error(PROTOCOL_MISSMATCH_VERSION);
    }

    if (
        message.length !== MESSAGE_LENGTH ||
        !Object.values(Version).includes(version) ||
        !Object.values(TrezorPushNotificationType).includes(type) ||
        !Object.values(TrezorPushNotificationMode).includes(mode)
    ) {
        throw new Error(PROTOCOL_MALFORMED);
    }

    return {
        type,
        mode,
    };
};
