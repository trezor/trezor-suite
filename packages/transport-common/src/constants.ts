// usb const
export const CONFIGURATION_ID = 1;
export const INTERFACE_ID = 0;
export const ENDPOINT_ID = 1;
export const DEBUGLINK_INTERFACE_ID = 1;
export const DEBUGLINK_ENDPOINT_ID = 2;
export const T1_HID_VENDOR = 0x534c;

export const T1_HID_PRODUCT = 0x0001;
const WEBUSB_FIRMWARE_PRODUCT = 0x53c1;
export const WEBUSB_BOOTLOADER_PRODUCT = 0x53c0;

export const TREZOR_USB_DESCRIPTORS = [
    // TREZOR v1
    // won't get opened, but we can show error at least
    { vendorId: 0x534c, productId: T1_HID_PRODUCT },
    // TREZOR webusb Bootloader
    { vendorId: 0x1209, productId: WEBUSB_BOOTLOADER_PRODUCT },
    // TREZOR webusb Firmware
    { vendorId: 0x1209, productId: WEBUSB_FIRMWARE_PRODUCT },
];

/**
 * How long is single transport action (call, acquire) allowed to take
 */
export const ACTION_TIMEOUT = 10000;

export const TRANSPORT = {
    /* events */
    START: 'transport-start',
    ERROR: 'transport-error',
    STOPPED: 'transport-stopped',
    DEVICE_CONNECTED: 'transport-device_connected',
    DEVICE_DISCONNECTED: 'transport-device_disconnected',
    DEVICE_SESSION_CHANGED: 'transport-device_session_changed',
    DEVICE_REQUEST_RELEASE: 'transport-device_request_release',
    SEND_MESSAGE_PROGRESS: 'transport-send_message_progress',
    TREZOR_PUSH_NOTIFICATION: 'trezor-push-notification',
    BATTERY_LEVEL: 'battery-level',
    /* messages */
    REQUEST_DEVICE: 'transport-request_device',
    GET_INFO: 'transport-get_info',
    SET_TRANSPORTS: 'transport-set_transports',
} as const;

// https://github.com/trezor/trezord-go/blob/db03d99230f5b609a354e3586f1dfc0ad6da16f7/core/core.go#L46-L47
export enum DEVICE_TYPE {
    TypeT1Hid = 0,
    TypeT1Webusb = 1,
    TypeT1WebusbBoot = 2,
    TypeT2 = 3,
    TypeT2Boot = 4,
    TypeEmulator = 5,
    TypeBluetooth = 6,
}
