// usb const
export const CONFIGURATION_ID = 1;
export const INTERFACE_ID = 0;
export const ENDPOINT_ID = 1;
export const DEBUGLINK_INTERFACE_ID = 1;
export const DEBUGLINK_ENDPOINT_ID = 2;
export const T1_HID_VENDOR = 0x534c;

const T1_HID_PRODUCT = 0x0001;
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
    DEVICE_CONNECTED: 'transport-device_connected',
    DEVICE_DISCONNECTED: 'transport-device_disconnected',
    DEVICE_SESSION_CHANGED: 'transport-device_session_changed',
    DEVICE_REQUEST_RELEASE: 'transport-device_request_release',
    /* messages */
    DISABLE_WEBUSB: 'transport-disable_webusb',
    REQUEST_DEVICE: 'transport-request_device',
    GET_INFO: 'transport-get_info',
} as const;
