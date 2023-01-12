export const TREZOR_DESCS = [
    // TREZOR v1
    // won't get opened, but we can show error at least
    { vendorId: 0x534c, productId: 0x0001 },
    // TREZOR webusb Bootloader
    { vendorId: 0x1209, productId: 0x53c0 },
    // TREZOR webusb Firmware
    { vendorId: 0x1209, productId: 0x53c1 },
];
