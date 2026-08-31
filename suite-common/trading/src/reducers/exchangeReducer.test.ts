import { combineReducers } from '@reduxjs/toolkit';

import { configureMockStore } from '@suite-common/test-utils';
import { type AccountKey } from '@suite-common/wallet-types';

import {
    changellyExchangeQuote,
    exchangeTradingFixtures,
} from './__fixtures__/exchangeTradingReducer';
import { tradingExchangeActions, tradingExchangeReducer } from './exchangeReducer';

describe('tradingExchangeReducer', () => {
    exchangeTradingFixtures.forEach(fixture => {
        it(fixture.description, () => {
            const store = configureMockStore({
                extra: undefined,
                reducer: combineReducers({
                    wallet: combineReducers({
                        trading: combineReducers({
                            exchange: tradingExchangeReducer,
                        }),
                    }),
                }),
                preloadedState: {
                    wallet: {
                        trading: {
                            exchange: fixture.initialState,
                        },
                    },
                },
            });
            fixture.actions.forEach(action => {
                store.dispatch(action);
            });
            expect(store.getState().wallet.trading.exchange).toEqual(fixture.result);
        });
    });

    describe('lastErrorMessage', () => {
        it('should be undefined initially', () => {
            const state = tradingExchangeReducer(undefined, { type: 'unknown' });

            expect(state.lastErrorMessage).toBeUndefined();
        });

        it('setLastErrorMessage should set lastErrorMessage', () => {
            const state = tradingExchangeReducer(
                undefined,
                tradingExchangeActions.setLastErrorMessage('Some error'),
            );

            expect(state.lastErrorMessage).toBe('Some error');
        });
    });

    describe('setSelectedQuoteSwapSlippage', () => {
        it('should do nothing when no quote is selected', () => {
            const actions = [tradingExchangeActions.setSelectedQuoteSwapSlippage('3')];

            const state = actions.reduce(tradingExchangeReducer, undefined);

            expect(state?.selectedQuote).toBeUndefined();
        });

        it('should do nothing when CEX quote is selected', () => {
            const actions = [
                tradingExchangeActions.saveSelectedQuote(changellyExchangeQuote),
                tradingExchangeActions.setSelectedQuoteSwapSlippage('3'),
            ];

            const state = actions.reduce(tradingExchangeReducer, undefined);

            expect(state?.selectedQuote).toBeDefined();
            expect(state?.selectedQuote?.swapSlippage).toBeUndefined();
        });

        it('should set selected quote swap slippage for DEX quote', () => {
            const actions = [
                tradingExchangeActions.saveSelectedQuote({
                    ...changellyExchangeQuote,
                    isDex: true,
                }),
                tradingExchangeActions.setSelectedQuoteSwapSlippage('3'),
            ];

            const state = actions.reduce(tradingExchangeReducer, undefined);

            expect(state?.selectedQuote?.swapSlippage).toBe('3');
        });
    });

    describe('setTradingAccountKey', () => {
        it('clears selected quote and quotes when the account key is cleared', () => {
            const actions = [
                tradingExchangeActions.saveSelectedQuote(changellyExchangeQuote),
                tradingExchangeActions.saveQuotes([changellyExchangeQuote]),
                tradingExchangeActions.setTradingAccountKey('account-1' as AccountKey),
                tradingExchangeActions.setTradingAccountKey(undefined),
            ];

            const state = actions.reduce(tradingExchangeReducer, undefined);

            expect(state?.tradingAccountKey).toBeUndefined();
            expect(state?.selectedQuote).toBeUndefined();
            expect(state?.quotes).toEqual([]);
            expect(state?.quotesRequest).toBeUndefined();
        });
    });
});
