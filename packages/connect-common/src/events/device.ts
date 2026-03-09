export const DEVICE_EVENT = 'DEVICE_EVENT';

export const DEVICE = {
    // device list events
    CONNECT: 'device-connect',
    CONNECT_UNACQUIRED: 'device-connect_unacquired',
    DISCONNECT: 'device-disconnect',
    CHANGED: 'device-changed',
    FIRMWARE_VERSION_CHANGED: 'device-firmware_version_changed',
    TREZOR_PUSH_NOTIFICATION: 'device-trezor_push_notification',

    // This event is triggered every time, the device provides the THP credentials to the Suite.
    // This happens on two occasions:
    //      1) User just entered the Code and the device provided the pairing credentials.
    //      2) User initiated the autoconnect flow and confirmed on the device the autoconnect.
    //         Device then responded with a new credential that allows the Suite to autoconnect.
    THP_CREDENTIALS_CHANGED: 'device-thp_credentials_changed',

    // trezor-link events in protobuf format
    BUTTON: 'button',
    PIN: 'pin',
    PASSPHRASE: 'passphrase',
    PASSPHRASE_ON_DEVICE: 'passphrase_on_device',
    WORD: 'word',
    THP_PAIRING: 'thp_pairing', // ask UI for pairing tag
    THP_PAIRING_STATUS_CHANGED: 'device-thp_pairing_status_changed',
} as const;
