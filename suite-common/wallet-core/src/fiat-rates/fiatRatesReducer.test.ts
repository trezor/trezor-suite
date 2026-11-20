import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type TickerId, type Timestamp } from '@suite-common/wallet-types';
import { getFiatRateKeyFromTicker } from '@suite-common/wallet-utils';
import { type BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { mockActionType, mockReducer } from '@trezor/redux-utils/mocks';

import { fiatRatesInitialState, prepareFiatRatesReducer } from './fiatRatesReducer';
import { updateFiatRatesThunk } from './fiatRatesThunks';
import { type FiatRatesState } from './fiatRatesTypes';

const fiatRatesReducer = prepareFiatRatesReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
    reducers: { storageLoadHistoricRates: mockReducer() },
});

const BASE_CURRENCY = 'usd' as BaseCurrencyCode;
const TICKER: TickerId = { symbol: asNetworkSymbol('eth') };
const FIAT_RATE_KEY = getFiatRateKeyFromTicker(TICKER, BASE_CURRENCY);

const fetchStarted = updateFiatRatesThunk.pending('request-id', {
    tickers: [TICKER],
    baseCurrencyCode: BASE_CURRENCY,
    rateType: 'current',
    fetchAttemptTimestamp: 1 as Timestamp,
});

const stateWithRate = (error: string | null): FiatRatesState => ({
    ...fiatRatesInitialState,
    current: {
        [FIAT_RATE_KEY]: {
            ticker: TICKER,
            lastSuccessfulFetchTimestamp: 0 as Timestamp,
            lastTickerTimestamp: 0 as Timestamp,
            isLoading: false,
            error,
        },
    },
});

describe('fiat rates reducer', () => {
    it('keeps the error of a failed rate while it is fetched again', () => {
        const state = fiatRatesReducer(stateWithRate('Missing rate'), fetchStarted);

        expect(state.current[FIAT_RATE_KEY]).toMatchObject({
            isLoading: true,
            error: 'Missing rate',
        });
    });

    it('starts a rate it has never fetched without an error', () => {
        const state = fiatRatesReducer(fiatRatesInitialState, fetchStarted);

        expect(state.current[FIAT_RATE_KEY]).toMatchObject({ isLoading: true, error: null });
    });
});
