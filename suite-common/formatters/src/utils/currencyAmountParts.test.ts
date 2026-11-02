import { getCurrencyAmountParts } from './currencyAmountParts';

const usd = { locale: 'en', currency: 'usd', isSatsValue: false };

describe(getCurrencyAmountParts.name, () => {
    it('keeps cents only by default', () => {
        expect(getCurrencyAmountParts({ ...usd, value: '1234.5678' })).toMatchObject({
            wholeNumber: '1,234',
            decimalNumber: '.57',
        });
    });

    it('keeps every decimal of an exact amount', () => {
        expect(
            getCurrencyAmountParts({ ...usd, value: '0.0000123456', isExact: true }),
        ).toMatchObject({ wholeNumber: '0', decimalNumber: '.0000123456' });
    });

    it('still shows cents for an exact amount without decimals', () => {
        expect(getCurrencyAmountParts({ ...usd, value: '3000', isExact: true })).toMatchObject({
            wholeNumber: '3,000',
            decimalNumber: '.00',
        });
    });
});
