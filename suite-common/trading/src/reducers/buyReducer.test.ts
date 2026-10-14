import { combineReducers } from '@reduxjs/toolkit';
import { type BuyTradeQuoteRequest, type CryptoId } from 'invity-api';

import { createTestCompositionRoot } from '@suite-common/test-utils';
import { toNetworkSymbolNonTestnet } from '@suite-common/wallet-config';
import { type AccountKey } from '@suite-common/wallet-types';

import { mercuryoApplePayQuote } from '../__fixtures__/buyUtils';
import { type TradingBuyFormProps } from '../types';
import { buyTradingFixtures } from './__fixtures__/buyTradingReducer';
import {
    type TradingBuyState,
    buyInitialState,
    tradingBuyActions,
    tradingBuyReducer,
} from './buyReducer';

type State = { wallet: { trading: { buy: TradingBuyState } } };

const btcSymbol = toNetworkSymbolNonTestnet('btc');

const FORM_VALUES: TradingBuyFormProps = {
    fiatInput: '10',
    amountInCrypto: false,
    currencySelect: { value: 'eur', label: 'EUR' },
    cryptoSelect: {
        id: 'bitcoin' as CryptoId,
        isNativeToken: true,
        name: 'Bitcoin',
        symbol: btcSymbol,
        coingeckoId: 'bitcoin',
        displaySymbol: 'BTC',
        contractAddress: null,
        networkName: 'Bitcoin',
        networkSymbol: btcSymbol,
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

describe('tradingBuyReducer', () => {
    buyTradingFixtures.forEach(f => {
        it(f.description, () => {
            const { store } = createTestCompositionRoot<void, State>({
                reducer: combineReducers({
                    wallet: combineReducers({
                        trading: combineReducers({
                            buy: tradingBuyReducer,
                        }),
                    }),
                }),
                preloadedState: {
                    wallet: {
                        trading: {
                            buy: f.initialState,
                        },
                    },
                },
            }).services;
            f.actions.forEach(action => {
                store.dispatch(action);
            });
            expect(store.getState().wallet.trading.buy).toEqual(f.result);
        });
    });

    describe('lastErrorMessage', () => {
        it('should be undefined initially', () => {
            const state = tradingBuyReducer(undefined, { type: 'unknown' });

            expect(state.lastErrorMessage).toBeUndefined();
        });

        it('setLastErrorMessage should set lastErrorMessage', () => {
            const state = tradingBuyReducer(
                undefined,
                tradingBuyActions.setLastErrorMessage('Some error'),
            );

            expect(state.lastErrorMessage).toBe('Some error');
        });
    });
    describe('saveFormValues', () => {
        it('stores a copy of the form values', () => {
            const state = tradingBuyReducer(
                undefined,
                tradingBuyActions.saveFormValues(FORM_VALUES),
            );

            expect(state.formValues).toEqual(FORM_VALUES);
            expect(state.formValues).not.toBe(FORM_VALUES);
            expect(state.formValues?.cryptoSelect).not.toBe(FORM_VALUES.cryptoSelect);
        });
    });

    describe('clearQuotesAndParams', () => {
        it('should clear quotes, quotesRequest, formValues, selectedQuote, and amountLimits', () => {
            const state = tradingBuyReducer(
                tradingBuyReducer(undefined, tradingBuyActions.saveFormValues(FORM_VALUES)),
                tradingBuyActions.clearQuotesAndParams(),
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
        const QUOTES_REQUEST: BuyTradeQuoteRequest = {
            wantCrypto: false,
            fiatCurrency: 'EUR',
            receiveCurrency: 'bitcoin' as CryptoId,
            fiatStringAmount: '10',
            country: 'CZ',
        };
        const withQuotes = () =>
            [
                tradingBuyActions.setTradingAccountKey(KEY_1),
                tradingBuyActions.saveQuoteRequest(QUOTES_REQUEST),
                tradingBuyActions.saveFormValues(FORM_VALUES),
                tradingBuyActions.saveQuotes([mercuryoApplePayQuote]),
                tradingBuyActions.saveSelectedQuote(mercuryoApplePayQuote),
            ].reduce(tradingBuyReducer, buyInitialState);

        it('clears quotes, quotesRequest, formValues and selectedQuote when the account key is cleared', () => {
            const state = tradingBuyReducer(
                withQuotes(),
                tradingBuyActions.setTradingAccountKey(undefined),
            );

            expect(state.tradingAccountKey).toBeUndefined();
            expect(state.quotes).toEqual([]);
            expect(state.quotesRequest).toBeUndefined();
            expect(state.formValues).toBeUndefined();
            expect(state.selectedQuote).toBeUndefined();
        });
    });
});
