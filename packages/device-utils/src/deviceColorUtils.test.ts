import { getDeviceColorVariant } from './deviceColorUtils';

describe(getDeviceColorVariant.name, () => {
    it.each([
        [0x0103, 3],
        [0x020002, 2],
        [0x020103, 3],
    ])('decodes THP model variant %i as color %i', (modelVariant, expectedColor) => {
        expect(
            getDeviceColorVariant({ thp: { properties: { model_variant: modelVariant } } }),
        ).toBe(expectedColor);
    });

    it('preserves a THP color without additional flags', () => {
        expect(getDeviceColorVariant({ thp: { properties: { model_variant: 4 } } })).toBe(4);
    });

    it('prefers the firmware color over the THP model variant', () => {
        expect(
            getDeviceColorVariant({
                features: { unit_color: 2 },
                thp: { properties: { model_variant: 0x0103 } },
            }),
        ).toBe(2);
    });

    it('keeps the default color when firmware reports an unspecified color', () => {
        expect(
            getDeviceColorVariant({
                features: { unit_color: 0 },
                thp: { properties: { model_variant: 0x0103 } },
            }),
        ).toBe(1);
    });

    it.each([undefined, 0, 0x0100, 0x020100])(
        'defaults to color 1 when THP model variant %s contains no color',
        modelVariant => {
            expect(
                getDeviceColorVariant({ thp: { properties: { model_variant: modelVariant } } }),
            ).toBe(1);
        },
    );

    it('defaults to color 1 when no device is available', () => {
        expect(getDeviceColorVariant()).toBe(1);
    });
});
