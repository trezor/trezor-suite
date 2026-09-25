import { typographyStylesBase } from '@trezor/theme';

import {
    getTradingAmountInputStyle,
    getTradingBaseCurrencyAmountFromCrypto,
    getTradingCryptoAmountFromBaseCurrency,
} from './tradingFormInputsUtils';

const { fontSize: maxFontSize } = typographyStylesBase['headline-md'];
const minFontSize = Math.ceil(maxFontSize / 2);

describe('getTradingAmountInputStyle', () => {
    it.each([undefined, '', '0.1'])(
        'uses the full font size for an empty or short value (%p)',
        value => {
            expect(getTradingAmountInputStyle(value).fontSize).toBe(maxFontSize);
        },
    );

    it('does not shrink below half of the full font size', () => {
        expect(getTradingAmountInputStyle('1'.repeat(50)).fontSize).toBe(minFontSize);
    });
});

describe('getTradingCryptoAmountFromBaseCurrency', () => {
    it('rounds the crypto amount down to the asset decimals', () => {
        expect(
            getTradingCryptoAmountFromBaseCurrency({
                baseCurrencyAmount: '1000',
                rate: 24.5,
                decimals: 6,
                isInSats: false,
            }),
        ).toBe('40.816326');
    });

    it('returns the crypto amount in satoshis', () => {
        expect(
            getTradingCryptoAmountFromBaseCurrency({
                baseCurrencyAmount: '100',
                rate: 60000,
                decimals: 8,
                isInSats: true,
            }),
        ).toBe('166666');
    });

    it.each([
        ['an empty amount', '', 24.5],
        ['a missing rate', '1000', undefined],
    ])('returns an empty amount for %s', (_, baseCurrencyAmount, rate) => {
        expect(
            getTradingCryptoAmountFromBaseCurrency({
                baseCurrencyAmount,
                rate,
                decimals: 6,
                isInSats: false,
            }),
        ).toBe('');
    });
});

describe('getTradingBaseCurrencyAmountFromCrypto', () => {
    it('rounds the base currency amount to its decimals', () => {
        expect(
            getTradingBaseCurrencyAmountFromCrypto({
                cryptoAmount: '40.816326',
                rate: 24.5,
                decimals: 6,
                isInSats: false,
                baseCurrencyDecimals: 2,
            }),
        ).toBe('1000');
    });

    it('reads the crypto amount in satoshis', () => {
        expect(
            getTradingBaseCurrencyAmountFromCrypto({
                cryptoAmount: '166666',
                rate: 60000,
                decimals: 8,
                isInSats: true,
                baseCurrencyDecimals: 2,
            }),
        ).toBe('100');
    });

    it.each([
        ['an empty amount', '', 24.5],
        ['a missing rate', '40', undefined],
    ])('returns an empty amount for %s', (_, cryptoAmount, rate) => {
        expect(
            getTradingBaseCurrencyAmountFromCrypto({
                cryptoAmount,
                rate,
                decimals: 6,
                isInSats: false,
                baseCurrencyDecimals: 2,
            }),
        ).toBe('');
    });
});
