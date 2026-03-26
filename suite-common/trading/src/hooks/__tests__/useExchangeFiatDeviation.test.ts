import { renderHook } from '@testing-library/react';
import { type CryptoId } from 'invity-api';

import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';

import { useExchangeFiatDeviation } from '../useExchangeFiatDeviation';
import { type TradingFiatRatesReturn, useTradingFiatValues } from '../useTradingFiatValues';

jest.mock('../useTradingFiatValues', () => ({
    useTradingFiatValues: jest.fn(),
}));

const mockedUseTradingFiatValues = jest.mocked(useTradingFiatValues);

const BITCOIN_CRYPTO_ID = 'bitcoin' as CryptoId;
const ETHEREUM_CRYPTO_ID = 'ethereum' as CryptoId;

const defaultProps = {
    sendCryptoId: BITCOIN_CRYPTO_ID,
    sendAmount: '1',
    receiveCryptoId: ETHEREUM_CRYPTO_ID,
    receiveAmount: '10',
    fiatCurrency: 'usd' as BaseCurrencyCode,
};

const createTradingFiatValuesResult = (fiatValue: string | null): TradingFiatRatesReturn => ({
    fiatValue,
    fiatRate: undefined,
    accountBalance: '1',
    formattedBalance: '1',
    symbol: 'btc',
    networkDecimals: 8,
    tokenAddress: undefined,
    fiatRatesUpdater: () => Promise.resolve(null),
});

const renderUseExchangeFiatDeviation = (props: Partial<typeof defaultProps> = {}) =>
    renderHook(() => useExchangeFiatDeviation({ ...defaultProps, ...props }));

describe('useExchangeFiatDeviation', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it('returns deviation and no threshold flags when below threshold', () => {
        mockedUseTradingFiatValues
            .mockReturnValueOnce(createTradingFiatValuesResult('1000'))
            .mockReturnValueOnce(createTradingFiatValuesResult('980'));

        const { result } = renderUseExchangeFiatDeviation();

        expect(result.current).toEqual({
            deviation: 0.02,
            exceedsThreshold: false,
            exceedsHighThreshold: false,
        });
    });

    it('sets deviation at 10%', () => {
        mockedUseTradingFiatValues
            .mockReturnValueOnce(createTradingFiatValuesResult('1000'))
            .mockReturnValueOnce(createTradingFiatValuesResult('900'));

        const { result } = renderUseExchangeFiatDeviation();

        expect(result.current).toEqual({
            deviation: 0.1,
            exceedsThreshold: true,
            exceedsHighThreshold: false,
        });
    });

    it('sets deviation at 20%', () => {
        mockedUseTradingFiatValues
            .mockReturnValueOnce(createTradingFiatValuesResult('1000'))
            .mockReturnValueOnce(createTradingFiatValuesResult('800'));

        const { result } = renderUseExchangeFiatDeviation();

        expect(result.current).toEqual({
            deviation: 0.2,
            exceedsThreshold: true,
            exceedsHighThreshold: true,
        });
    });

    it('returns null when fiat values are missing', () => {
        mockedUseTradingFiatValues.mockReturnValue(null);

        const { result } = renderUseExchangeFiatDeviation();

        expect(result.current).toBeNull();
    });
});
