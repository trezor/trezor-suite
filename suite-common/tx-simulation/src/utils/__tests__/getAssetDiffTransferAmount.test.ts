import { getAssetDiffTransferAmount } from '../getAssetDiffTransferAmount';

describe('getAssetDiffTransferAmount', () => {
    it('converts a raw subunit value using the asset decimals', () => {
        const result = getAssetDiffTransferAmount({ raw_value: '1234500', value: '99' }, 6);

        expect(result?.toString()).toBe('1.2345');
    });

    it('falls back to the main-unit value when the raw value is invalid', () => {
        const result = getAssetDiffTransferAmount({ raw_value: 'invalid', value: '2.5' }, 6);

        expect(result?.toString()).toBe('2.5');
    });

    it('returns null when no usable value is available', () => {
        expect(getAssetDiffTransferAmount({ raw_value: 'invalid' }, undefined)).toBeNull();
    });
});
