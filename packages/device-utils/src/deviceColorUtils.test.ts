import { getDeviceColorVariant } from './deviceColorUtils';

describe(getDeviceColorVariant.name, () => {
    it.each([
        [0x0103, 3],
        [0x020002, 2],
        [0x020103, 3],
        [undefined, 1],
        [0, 1],
        [0x0100, 1],
        [0x020100, 1],
    ])('decodes THP model variant %s as color %i', (modelVariant, expectedColor) => {
        expect(
            getDeviceColorVariant({ thp: { properties: { model_variant: modelVariant } } }),
        ).toBe(expectedColor);
    });

    it.each([
        [2, 2],
        [0, 1],
    ])('prefers firmware color %i over the THP model variant', (unitColor, expectedColor) => {
        expect(
            getDeviceColorVariant({
                features: { unit_color: unitColor },
                thp: { properties: { model_variant: 0x0103 } },
            }),
        ).toBe(expectedColor);
    });
});
