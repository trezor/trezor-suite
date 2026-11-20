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

    it('puts the symbol right before the amount when the locale leaves no space', () => {
        expect(getCurrencyAmountParts({ ...usd, value: '1' })).toMatchObject({
            currencySymbol: '$',
            currencySymbolSeparator: '',
            isCurrencySymbolFirst: true,
        });
    });

    it('keeps the space the locale puts before a symbol that follows the amount', () => {
        expect(getCurrencyAmountParts({ ...usd, locale: 'cs', value: '1234.5' })).toMatchObject({
            currencySymbol: 'US$',
            currencySymbolSeparator: '\u00a0',
            wholeNumber: '1\u00a0234',
            isCurrencySymbolFirst: false,
        });
    });

    it('keeps the space the locale puts after a currency code that leads', () => {
        expect(getCurrencyAmountParts({ ...usd, currency: 'czk', value: '1' })).toMatchObject({
            currencySymbol: 'CZK',
            currencySymbolSeparator: '\u00a0',
            isCurrencySymbolFirst: true,
        });
    });

    it('spaces sats off the amount like a unit', () => {
        expect(
            getCurrencyAmountParts({
                locale: 'en',
                currency: 'btc',
                isSatsValue: true,
                value: '0.01',
            }),
        ).toMatchObject({
            currencySymbol: 'sat',
            currencySymbolSeparator: '\u00a0',
            wholeNumber: '1,000,000',
            decimalNumber: '',
            isCurrencySymbolFirst: false,
        });
    });
});
