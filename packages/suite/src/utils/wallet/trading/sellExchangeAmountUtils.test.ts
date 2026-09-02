import { type NetworkSymbol } from '@suite-common/wallet-config';

import { calcCryptoFromFiat, calcMaxTokenAmount, calcRatioAmount } from './sellExchangeAmountUtils';

describe('calcCryptoFromFiat', () => {
    it('converts a fiat amount to a crypto amount using the rate and network decimals', () => {
        const result = calcCryptoFromFiat({
            fiatAmount: '100',
            rate: 50000,
            networkDecimals: 8,
            shouldSendInSats: false,
        });

        expect(result).toBe('0.00200000');
    });

    it('returns the amount in subunits (sats) when shouldSendInSats is set', () => {
        const result = calcCryptoFromFiat({
            fiatAmount: '100',
            rate: 50000,
            networkDecimals: 8,
            shouldSendInSats: true,
        });

        expect(result).toBe('200000');
    });

    it('returns an empty string when the rate is missing', () => {
        const result = calcCryptoFromFiat({
            fiatAmount: '100',
            rate: undefined,
            networkDecimals: 8,
            shouldSendInSats: false,
        });

        expect(result).toBe('');
    });
});

describe('calcRatioAmount', () => {
    const defaultParams = {
        balance: '2',
        decimals: 8,
        networkDecimals: 8,
        shouldSendInSats: false,
        symbol: 'btc' as NetworkSymbol,
        contractAddress: undefined,
        formattedBalance: '2',
        fee: '0',
    };

    it('divides the balance by the divisor with no reserve applied', () => {
        const { cryptoInputValue, cryptoAmountWithReserve } = calcRatioAmount({
            ...defaultParams,
            divisor: 2,
            isNetworkReserveEnabled: false,
        });

        expect(cryptoInputValue).toBe('1');
        expect(cryptoAmountWithReserve).toBe('1');
    });

    it('converts to subunits when shouldSendInSats is set', () => {
        const { cryptoInputValue } = calcRatioAmount({
            ...defaultParams,
            divisor: 4,
            shouldSendInSats: true,
            isNetworkReserveEnabled: false,
        });

        expect(cryptoInputValue).toBe('50000000');
    });
});

describe('calcMaxTokenAmount', () => {
    it('caps the amount at the token balance decimals', () => {
        const result = calcMaxTokenAmount({
            balance: '123.454',
            decimals: 2,
            networkDecimals: 8,
            shouldSendInSats: false,
        });

        expect(result).toBe('123.45');
    });

    it('returns the amount in subunits when shouldSendInSats is set', () => {
        const result = calcMaxTokenAmount({
            balance: '1.5',
            decimals: 8,
            networkDecimals: 8,
            shouldSendInSats: true,
        });

        expect(result).toBe('150000000');
    });
});
