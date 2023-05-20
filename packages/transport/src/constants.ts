// protocol const
export const MESSAGE_HEADER_BYTE = 0x23;
export const HEADER_SIZE = 1 + 1 + 4 + 2;
export const BUFFER_SIZE = 63;

// usb const
export const CONFIGURATION_ID = 1;
export const INTERFACE_ID = 0;
export const ENDPOINT_ID = 1;
export const T1_HID_VENDOR = 0x534c;
export const TREZOR_USB_DESCRIPTORS = [
    // TREZOR v1
    // won't get opened, but we can show error at least
    { vendorId: 0x534c, productId: 0x0001 },
    // TREZOR webusb Bootloader
    { vendorId: 0x1209, productId: 0x53c0 },
    // TREZOR webusb Firmware
    { vendorId: 0x1209, productId: 0x53c1 },
];

/**
 * How long is single transport action (call, acquire) allowed to take
 */
export const ACTION_TIMEOUT = 10000;

export const TRANSPORT = {
    START: 'transport-start',
    ERROR: 'transport-error',
    UPDATE: 'transport-update',
    DISABLE_WEBUSB: 'transport-disable_webusb',
    REQUEST_DEVICE: 'transport-request_device',
} as const;