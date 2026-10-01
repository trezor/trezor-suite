import { combineReducers } from '@reduxjs/toolkit';
import { type CryptoId, type SellFiatTradeQuoteRequest } from 'invity-api';

import { createTestCompositionRoot } from '@suite-common/test-utils';
import { toNetworkSymbolNonTestnet } from '@suite-common/wallet-config';
import { type AccountKey } from '@suite-common/wallet-types';

import { MIN_MAX_QUOTES_LOW } from '../__fixtures__/sellUtils';
import { type TradingSellFormProps } from '../types';
import { sellTradingFixtures } from './__fixtures__/sellTradingReducer';
import {
    type TradingSellState,
    sellInitialState,
    tradingSellActions,
    tradingSellReducer,
} from './sellReducer';

type State = { wallet: { trading: { sell: TradingSellState } } };

const btcSymbol = toNetworkSymbolNonTestnet('btc');

const FORM_VALUES: TradingSellFormProps = {
    feePerUnit: '',
    feeLimit: '',
    options: ['broadcast'],
    bitcoinLocktimeBlockHeight: '',
    bitcoinLocktimeDatetime: '',
    ethereumNonce: '',
    transactionData: '',
    destinationTag: '',
    isCoinControlEnabled: false,
    hasCoinControlBeenOpened: false,
    utxoSorting: 'newestFirst',
    selectedUtxos: [],
    outputs: [
        {
            type: 'payment',
            address: 'address',
            amount: '0.01',
            fiat: '',
            currency: { value: 'eur', label: 'EUR' },
            token: null,
            label: '',
        },
    ],
    amountInCrypto: true,
    sendCryptoSelect: {
        id: 'bitcoin' as CryptoId,
        isNativeToken: true,
        name: 'Bitcoin',
        symbol: btcSymbol,
        coingeckoId: 'bitcoin',
        displaySymbol: 'BTC',
        contractAddress: null,
        networkName: 'Bitcoin',
        networkSymbol: btcSymbol,
        accountKey: 'account-1' as AccountKey,
    },
    countrySelect: {
        value: 'CZ',
        codeAlpha3: 'CZE',
        flag: '🇨🇿',
        name: 'Czechia',
        label: '🇨🇿 Czechia',
        shortLabel: '🇨🇿 CZE',
    },
};

describe('tradingSellReducer', () => {
    sellTradingFixtures.forEach(fixture => {
        it(fixture.description, () => {
            const { store } = createTestCompositionRoot<void, State>({
                reducer: combineReducers({
                    wallet: combineReducers({
                        trading: combineReducers({
                            sell: tradingSellReducer,
                        }),
                    }),
                }),
                preloadedState: {
                    wallet: {
                        trading: {
                            sell: fixture.initialState,
                        },
                    },
                },
            }).services;
            fixture.actions.forEach(action => {
                store.dispatch(action);
            });
            expect(store.getState().wallet.trading.sell).toEqual(fixture.result);
        });
    });

    describe('lastErrorMessage', () => {
        it('should be undefined initially', () => {
            const state = tradingSellReducer(undefined, { type: 'unknown' });

            expect(state.lastErrorMessage).toBeUndefined();
        });

        it('setLastErrorMessage should set lastErrorMessage', () => {
            const state = tradingSellReducer(
                undefined,
                tradingSellActions.setLastErrorMessage('Some error'),
            );

            expect(state.lastErrorMessage).toBe('Some error');
        });
    });
    describe('saveFormValues', () => {
        it('stores a copy of the form values', () => {
            const state = tradingSellReducer(
                undefined,
                tradingSellActions.saveFormValues(FORM_VALUES),
            );

            expect(state.formValues).toEqual(FORM_VALUES);
            expect(state.formValues).not.toBe(FORM_VALUES);
            expect(state.formValues?.outputs).not.toBe(FORM_VALUES.outputs);
        });
    });

    describe('clearQuotesAndParams', () => {
        it('should clear quotes, quotesRequest, formValues, selectedQuote, and amountLimits', () => {
            const state = tradingSellReducer(
                tradingSellReducer(undefined, tradingSellActions.saveFormValues(FORM_VALUES)),
                tradingSellActions.clearQuotesAndParams(),
            );

            expect(state.quotes).toEqual([]);
            expect(state.quotesRequest).toBeUndefined();
            expect(state.formValues).toBeUndefined();
            expect(state.selectedQuote).toBeUndefined();
            expect(state.amountLimits).toBeUndefined();
        });
    });

    describe('setTradingAccountKey', () => {
        const KEY_1 = 'account-1' as AccountKey;
        const KEY_2 = 'account-2' as AccountKey;
        const withLimits = () => {
            let state = tradingSellReducer(
                undefined,
                tradingSellActions.setTradingAccountKey(KEY_1),
            );
            state = tradingSellReducer(
                state,
                tradingSellActions.setAmountLimits({ currency: 'eth' }),
            );
            state = tradingSellReducer(state, tradingSellActions.saveFormValues(FORM_VALUES));

            return state;
        };

        it('clears amountLimits and formValues when the account key changes', () => {
            const state = tradingSellReducer(
                withLimits(),
                tradingSellActions.setTradingAccountKey(KEY_2),
            );

            expect(state.tradingAccountKey).toBe(KEY_2);
            expect(state.amountLimits).toBeUndefined();
            expect(state.formValues).toBeUndefined();
        });

        it('keeps amountLimits and formValues when the same account key is set', () => {
            const state = tradingSellReducer(
                withLimits(),
                tradingSellActions.setTradingAccountKey(KEY_1),
            );

            expect(state.amountLimits).toEqual({ currency: 'eth' });
            expect(state.formValues).toEqual(FORM_VALUES);
        });

        const QUOTES_REQUEST: SellFiatTradeQuoteRequest = {
            amountInCrypto: true,
            cryptoCurrency: 'bitcoin' as CryptoId,
            fiatCurrency: 'EUR',
            cryptoStringAmount: '0.01',
            country: 'CZ',
        };
        const [SELECTED_QUOTE] = MIN_MAX_QUOTES_LOW;
        const withQuotes = () =>
            [
                tradingSellActions.setTradingAccountKey(KEY_1),
                tradingSellActions.saveQuoteRequest(QUOTES_REQUEST),
                tradingSellActions.saveFormValues(FORM_VALUES),
                tradingSellActions.saveQuotes(MIN_MAX_QUOTES_LOW),
                tradingSellActions.saveSelectedQuote(SELECTED_QUOTE),
            ].reduce(tradingSellReducer, sellInitialState);

        it('clears quotes, quotesRequest, formValues and selectedQuote when the account key is cleared', () => {
            const state = tradingSellReducer(
                withQuotes(),
                tradingSellActions.setTradingAccountKey(undefined),
            );

            expect(state.tradingAccountKey).toBeUndefined();
            expect(state.quotes).toEqual([]);
            expect(state.quotesRequest).toBeUndefined();
            expect(state.formValues).toBeUndefined();
            expect(state.selectedQuote).toBeUndefined();
        });
    });
});
