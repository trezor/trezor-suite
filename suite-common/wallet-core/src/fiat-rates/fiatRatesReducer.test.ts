import { extraDependenciesCommonMock } from '@suite-common/test-utils';
import { type Timestamp } from '@suite-common/wallet-types';
import { getFiatRateKeyFromTicker } from '@suite-common/wallet-utils';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';

import { fiatRatesInitialState, prepareFiatRatesReducer } from './fiatRatesReducer';
import { updateFiatRatesThunk } from './fiatRatesThunks';
import { type FiatRatesState } from './fiatRatesTypes';

// The reducer is exercised directly (not via store.dispatch) because a mock store swallows the
// exception thrown inside a reducer, which would hide the very crash this suite guards against.
const fiatRatesReducer = prepareFiatRatesReducer(extraDependenciesCommonMock);

const BASE_CURRENCY = 'usd' as BaseCurrencyCode;

const rejectedAction = (tickers: { symbol: string }[]) =>
    updateFiatRatesThunk.rejected(new Error('boom'), 'req-id', {
        tickers,
        baseCurrencyCode: BASE_CURRENCY,
        rateType: 'current',
        fetchAttemptTimestamp: 0 as Timestamp,
    } as any);

describe('fiatRatesReducer updateFiatRatesThunk.rejected', () => {
    it('does not throw for a testnet ticker with no state entry (pending skips testnet)', () => {
        // Regression: the rejected handler used to index the entry unconditionally, so a testnet
        // ticker (never seeded by the pending handler) crashed with "Cannot set property 'error'
        // of undefined".
        expect(() =>
            fiatRatesReducer(fiatRatesInitialState, rejectedAction([{ symbol: 'test' }])),
        ).not.toThrow();
    });

    it('does not throw for a non-testnet ticker whose entry was removed mid-flight', () => {
        expect(() =>
            fiatRatesReducer(fiatRatesInitialState, rejectedAction([{ symbol: 'btc' }])),
        ).not.toThrow();
    });

    it('records the error on an existing non-testnet entry', () => {
        const key = getFiatRateKeyFromTicker({ symbol: 'btc' }, BASE_CURRENCY);
        const preloaded: FiatRatesState = {
            current: {
                [key]: {
                    lastSuccessfulFetchTimestamp: 0 as Timestamp,
                    lastTickerTimestamp: 0 as Timestamp,
                    isLoading: true,
                    error: null,
                    ticker: { symbol: 'btc' },
                },
            },
            lastWeek: {},
            historic: {},
        };

        const next = fiatRatesReducer(preloaded, rejectedAction([{ symbol: 'btc' }]));

        const entry = next.current[key];
        expect(entry?.isLoading).toBe(false);
        expect(entry?.error).toContain('boom');
    });
});
