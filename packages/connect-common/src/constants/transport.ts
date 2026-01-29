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
