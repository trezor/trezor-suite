import {
    isBaseCurrencyCode,
    isFiatBaseCurrencyCode,
    isValuablesBaseCurrencyCode,
} from '../baseCurrency';

describe('baseCurrency', () => {
    describe('isBaseCurrencyCode', () => {
        it.each(['usd', 'eur', 'btc', 'xag'])(`should return true for [%s]`, code => {
            expect(isBaseCurrencyCode(code)).toBe(true);
        });

        it('should be false for unknown code', () => {
            expect(isBaseCurrencyCode('dnd')).toBe(false);
        });
    });

    describe('isFiatBaseCurrencyCode', () => {
        it.each(['usd', 'eur'])(`should return true for [%s]`, code => {
            expect(isFiatBaseCurrencyCode(code)).toBe(true);
        });

        it.each(['btc', 'xag'])('should be false for [%s]', code => {
            expect(isFiatBaseCurrencyCode(code)).toBe(false);
        });

        it('should be false for unknown code', () => {
            expect(isFiatBaseCurrencyCode('dnd')).toBe(false);
        });
    });

    describe('isValuablesBaseCurrencyCode', () => {
        it.each(['btc', 'xag'])(`should return true for [%s]`, code => {
            expect(isValuablesBaseCurrencyCode(code)).toBe(true);
        });

        it.each(['usd', 'eur'])('should be false for [%s]', code => {
            expect(isValuablesBaseCurrencyCode(code)).toBe(false);
        });

        it('should be false for unknown code', () => {
            expect(isValuablesBaseCurrencyCode('dnd')).toBe(false);
        });
    });
});
