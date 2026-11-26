import { asNetworkSymbol } from '@suite-common/wallet-config';
import {
    type AccountKey,
    type CryptoBaseCurrencyPair,
    type FiatRatesResult,
    type TickerId,
    asTimestamp,
} from '@suite-common/wallet-types';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { mockActionType, mockReducer } from '@trezor/redux-utils/mocks';

import { fiatRatesInitialState, prepareFiatRatesReducer } from './fiatRatesReducer';
import { updateTxsFiatRatesThunk } from './fiatRatesThunks';
import { type FiatRatesState } from './fiatRatesTypes';

const LOCAL_CURRENCY = 'usd' as BaseCurrencyCode;
const BTC: TickerId = { symbol: asNetworkSymbol('btc') };
const ETH: TickerId = { symbol: asNetworkSymbol('eth') };
const BTC_USD = 'btc-usd' as CryptoBaseCurrencyPair;
const ETH_USD = 'eth-usd' as CryptoBaseCurrencyPair;

const HOUR_1 = asTimestamp(1700002800);
const HOUR_2 = asTimestamp(1700006400);
const HOUR_3 = asTimestamp(1700010000);

const fiatRatesReducer = prepareFiatRatesReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
    reducers: { storageLoadHistoricRates: mockReducer() },
});

const reduceTxsRates = (
    state: FiatRatesState,
    rates: { tickerId: TickerId; rates: FiatRatesResult[] }[],
) =>
    fiatRatesReducer(
        state,
        updateTxsFiatRatesThunk.fulfilled(
            {
                account: null,
                rates: rates.map(rate => ({ ...rate, localCurrency: LOCAL_CURRENCY })),
            },
            'request-id',
            {
                accountKey: 'descriptor-btc-device' as AccountKey,
                txs: [],
                baseCurrencyCode: LOCAL_CURRENCY,
            },
        ),
    );

describe('fiatRatesReducer', () => {
    describe('updateTxsFiatRatesThunk.fulfilled', () => {
        it('stores the rates of each ticker by their timestamp', () => {
            const state = reduceTxsRates(fiatRatesInitialState, [
                {
                    tickerId: BTC,
                    rates: [
                        { lastTickerTimestamp: HOUR_1, rate: 100 },
                        { lastTickerTimestamp: HOUR_2, rate: 200 },
                    ],
                },
                { tickerId: ETH, rates: [{ lastTickerTimestamp: HOUR_1, rate: 10 }] },
            ]);

            expect(state.historic).toEqual({
                [BTC_USD]: { [HOUR_1]: 100, [HOUR_2]: 200 },
                [ETH_USD]: { [HOUR_1]: 10 },
            });
        });

        it('adds new rates to the stored ones and overwrites the same timestamp', () => {
            const stored: FiatRatesState = {
                ...fiatRatesInitialState,
                historic: {
                    [BTC_USD]: { [HOUR_1]: 100, [HOUR_2]: 200 },
                    [ETH_USD]: { [HOUR_1]: 10 },
                },
            };

            const state = reduceTxsRates(stored, [
                {
                    tickerId: BTC,
                    rates: [
                        { lastTickerTimestamp: HOUR_2, rate: 250 },
                        { lastTickerTimestamp: HOUR_3, rate: 300 },
                    ],
                },
            ]);

            expect(state.historic).toEqual({
                [BTC_USD]: { [HOUR_1]: 100, [HOUR_2]: 250, [HOUR_3]: 300 },
                [ETH_USD]: { [HOUR_1]: 10 },
            });
            expect(stored.historic[BTC_USD]).toEqual({ [HOUR_1]: 100, [HOUR_2]: 200 });
            expect(state.historic[ETH_USD]).toBe(stored.historic[ETH_USD]);
        });

        it('keeps the stored rate and adds no key for a timestamp without a rate', () => {
            const stored: FiatRatesState = {
                ...fiatRatesInitialState,
                historic: { [BTC_USD]: { [HOUR_1]: 100 } },
            };

            const state = reduceTxsRates(stored, [
                {
                    tickerId: BTC,
                    rates: [
                        { lastTickerTimestamp: HOUR_1, rate: undefined },
                        { lastTickerTimestamp: HOUR_2, rate: undefined },
                        { lastTickerTimestamp: HOUR_3, rate: 0 },
                    ],
                },
            ]);

            expect(state.historic[BTC_USD]).toStrictEqual({ [HOUR_1]: 100, [HOUR_3]: 0 });
        });
    });
});
