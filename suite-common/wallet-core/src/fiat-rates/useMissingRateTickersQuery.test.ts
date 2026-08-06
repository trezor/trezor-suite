import { useDispatch } from 'react-redux';

import { commonQueryKeys, useQuery } from '@suite-common/react-query';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type TickerId, toTokenAddress } from '@suite-common/wallet-types';

import { updateFiatRatesThunk } from './fiatRatesThunks';
import { useMissingRateTickersQuery } from './useMissingRateTickersQuery';

jest.mock('react-redux', () => ({
    useDispatch: jest.fn(),
}));

jest.mock('@suite-common/react-query', () => ({
    commonQueryKeys: {
        missingRateTickers: jest.fn((tickers, baseCurrencyCode) => [
            'missing-rate-tickers',
            tickers,
            baseCurrencyCode,
        ]),
    },
    useQuery: jest.fn(query => query),
}));

jest.mock('./fiatRatesThunks', () => ({
    updateFiatRatesThunk: jest.fn(payload => ({
        type: 'updateFiatRatesThunk',
        payload,
    })),
}));

const mockUseDispatch = jest.mocked(useDispatch);
const mockUseQuery = jest.mocked(useQuery);
const mockMissingRateTickersQueryKey = jest.mocked(commonQueryKeys.missingRateTickers);
const mockUpdateFiatRatesThunk = jest.mocked(updateFiatRatesThunk);

const missingRateTickers: TickerId[] = [
    {
        symbol: asNetworkSymbol('eth'),
        tokenAddress: toTokenAddress('0x0000000000000000000000000000000000000001'),
    },
];

describe('useMissingRateTickersQuery', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        mockUseDispatch.mockReturnValue(jest.fn());
    });

    it('disables the query when there are no missing rate tickers', () => {
        useMissingRateTickersQuery({
            missingRateTickers: [],
            baseCurrencyCode: 'usd',
        });

        expect(mockMissingRateTickersQueryKey).toHaveBeenCalledWith([], 'usd');
        expect(mockUseQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }));
    });

    it('fetches missing token fiat rates with forced token fetching', async () => {
        const unwrap = jest.fn().mockResolvedValue(undefined);
        const dispatch = jest.fn(() => ({ unwrap }));

        mockUseDispatch.mockReturnValue(dispatch);

        useMissingRateTickersQuery({
            missingRateTickers,
            baseCurrencyCode: 'usd',
        });

        const queryParams = mockUseQuery.mock.calls[mockUseQuery.mock.calls.length - 1]?.[0] as
            | { queryFn: () => Promise<unknown> }
            | undefined;

        expect(mockUseQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: true }));
        await queryParams?.queryFn();
        expect(mockUpdateFiatRatesThunk).toHaveBeenCalledWith({
            tickers: missingRateTickers,
            baseCurrencyCode: 'usd',
            rateType: 'current',
            fetchAttemptTimestamp: expect.any(Number),
            forceFetchToken: true,
        });
        expect(dispatch).toHaveBeenCalledWith({
            type: 'updateFiatRatesThunk',
            payload: expect.objectContaining({
                tickers: missingRateTickers,
                baseCurrencyCode: 'usd',
                rateType: 'current',
                forceFetchToken: true,
            }),
        });
        expect(unwrap).toHaveBeenCalledTimes(1);
    });
});
