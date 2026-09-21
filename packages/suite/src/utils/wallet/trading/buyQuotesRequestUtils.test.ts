import { type CryptoId } from 'invity-api';

import {
    TRADING_FORM_CRYPTO_INPUT,
    TRADING_FORM_FIAT_INPUT,
    type TradingAssetOption,
    type TradingBuyFormProps,
    type TradingCountryOption,
} from '@suite-common/trading';

import {
    getBuyActiveAmount,
    getBuyActiveAmountField,
    isBuyQuotesFetchAllowed,
} from './buyQuotesRequestUtils';

const baseValues: TradingBuyFormProps = {
    cryptoSelect: { id: 'bitcoin' as CryptoId, networkSymbol: 'btc' } as TradingAssetOption,
    countrySelect: { value: 'DE', label: 'Germany' } as TradingCountryOption,
    countrySubdivisionSelect: undefined,
    currencySelect: { value: 'eur', label: 'EUR' },
    fiatInput: '100',
    cryptoInput: undefined,
    receiveAddress: 'bc1qaddress',
    paymentMethod: { value: 'creditCard', label: 'Credit card' },
    provider: 'somebody',
    amountInCrypto: false,
};

describe('getBuyActiveAmountField', () => {
    it('points to the fiat input while the amount is entered in fiat', () => {
        expect(getBuyActiveAmountField(baseValues)).toBe(TRADING_FORM_FIAT_INPUT);
    });

    it('points to the crypto input while the amount is entered in crypto', () => {
        expect(getBuyActiveAmountField({ ...baseValues, amountInCrypto: true })).toBe(
            TRADING_FORM_CRYPTO_INPUT,
        );
    });
});

describe('getBuyActiveAmount', () => {
    it('reads the fiat side while the amount is entered in fiat', () => {
        expect(getBuyActiveAmount({ ...baseValues, cryptoInput: '0.5' })).toBe('100');
    });

    it('reads the crypto side while the amount is entered in crypto', () => {
        expect(
            getBuyActiveAmount({ ...baseValues, cryptoInput: '0.5', amountInCrypto: true }),
        ).toBe('0.5');
    });
});

describe('isBuyQuotesFetchAllowed', () => {
    it('allows fetch when required selects and a positive amount are present', () => {
        expect(isBuyQuotesFetchAllowed(baseValues)).toBe(true);
    });

    it('allows fetch using the crypto input while the amount is entered in crypto', () => {
        const values: TradingBuyFormProps = {
            ...baseValues,
            fiatInput: undefined,
            cryptoInput: '0.5',
            amountInCrypto: true,
        };

        expect(isBuyQuotesFetchAllowed(values)).toBe(true);
    });

    it('ignores the inactive side', () => {
        const values: TradingBuyFormProps = {
            ...baseValues,
            fiatInput: undefined,
            cryptoInput: '0.5',
        };

        expect(isBuyQuotesFetchAllowed(values)).toBe(false);
    });

    it.each(['cryptoSelect', 'countrySelect', 'currencySelect'] as const)(
        'blocks fetch when %s is missing',
        field => {
            // deliberately drops a required select to exercise the guard
            const values = { ...baseValues, [field]: undefined } as unknown as TradingBuyFormProps;

            expect(isBuyQuotesFetchAllowed(values)).toBe(false);
        },
    );

    it('blocks fetch when the country subdivision is required but empty', () => {
        const values: TradingBuyFormProps = {
            ...baseValues,
            countrySelect: { value: 'US', label: 'United States' } as TradingCountryOption,
            countrySubdivisionSelect: undefined,
        };

        expect(isBuyQuotesFetchAllowed(values)).toBe(false);
    });

    it('blocks fetch when the amount is empty', () => {
        const values: TradingBuyFormProps = {
            ...baseValues,
            fiatInput: undefined,
            cryptoInput: undefined,
        };

        expect(isBuyQuotesFetchAllowed(values)).toBe(false);
    });

    it('blocks fetch when the amount is zero', () => {
        const values: TradingBuyFormProps = { ...baseValues, fiatInput: '0' };

        expect(isBuyQuotesFetchAllowed(values)).toBe(false);
    });
});
