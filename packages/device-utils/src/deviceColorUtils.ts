// NOTE: when a device eg. a testing unit, doesnt have a color variant (0 | null | undefined), we default to 1
export const normalizeDeviceColorVariant = (colorVariant?: number): number => colorVariant || 1;

export const getDeviceColorVariant = (device: {
    features?: { unit_color?: number };
    thp?: { properties?: { model_variant?: number } };
}): number =>
    normalizeDeviceColorVariant(
        device.features?.unit_color ?? device.thp?.properties?.model_variant,
    );
