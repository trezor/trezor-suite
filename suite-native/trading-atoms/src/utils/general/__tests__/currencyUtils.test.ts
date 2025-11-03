import { getCurrencyLabel } from '../currencyUtils';

describe('currencyUtils', () => {
    describe('getCurrencyLabel', () => {
        it('should return label from supported currencies map', () => {
            expect(getCurrencyLabel('czk')).toBe('Czech Koruna');
        });

        it('should return label from other currencies map', () => {
            expect(getCurrencyLabel('xof')).toBe('West African CFA Franc');
        });

        it('should be uppercase code otherwise', () => {
            expect(getCurrencyLabel('xyz')).toBe('XYZ');
        });
    });
});
