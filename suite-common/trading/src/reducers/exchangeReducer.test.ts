import { combineReducers } from '@reduxjs/toolkit';
import { type CryptoId } from 'invity-api';

import { createTestCompositionRoot } from '@suite-common/test-utils';
import { toNetworkSymbolNonTestnet } from '@suite-common/wallet-config';
import { type AccountKey } from '@suite-common/wallet-types';

import { type TradingExchangeFormProps } from '../types';
import {
    changellyExchangeQuote,
    exchangeTradingFixtures,
} from './__fixtures__/exchangeTradingReducer';
import {
    type TradingExchangeState,
    tradingExchangeActions,
    tradingExchangeReducer,
} from './exchangeReducer';

type State = { wallet: { trading: { exchange: TradingExchangeState } } };

const btcSymbol = toNetworkSymbolNonTestnet('btc');
const ethSymbol = toNetworkSymbolNonTestnet('eth');

const FORM_VALUES: TradingExchangeFormProps = {
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
    receiveCryptoSelect: {
        id: 'ethereum' as CryptoId,
        isNativeToken: true,
        name: 'Ethereum',
        symbol: ethSymbol,
        coingeckoId: 'ethereum',
        displaySymbol: 'ETH',
        contractAddress: null,
        networkName: 'Ethereum',
        networkSymbol: ethSymbol,
    },
    rateType: 'fixed',
    exchangeType: 'CEX',
    exchangeComparatorKycFilter: 'all',
    exchangeComparatorRateFilter: 'all',
};

describe('tradingExchangeReducer', () => {
    exchangeTradingFixtures.forEach(fixture => {
        it(fixture.description, () => {
            const { store } = createTestCompositionRoot<void, State>({
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
            }).services;
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

    describe('saveFormValues', () => {
        it('stores a copy of the form values', () => {
            const state = tradingExchangeReducer(
                undefined,
                tradingExchangeActions.saveFormValues(FORM_VALUES),
            );

            expect(state.formValues).toEqual(FORM_VALUES);
            expect(state.formValues).not.toBe(FORM_VALUES);
            expect(state.formValues?.outputs).not.toBe(FORM_VALUES.outputs);
        });
    });

    describe('clearQuotesAndParams', () => {
        it('clears quotes, quotesRequest, formValues, selectedQuote and amountLimits', () => {
            const actions = [
                tradingExchangeActions.saveSelectedQuote(changellyExchangeQuote),
                tradingExchangeActions.saveQuotes([changellyExchangeQuote]),
                tradingExchangeActions.saveFormValues(FORM_VALUES),
                tradingExchangeActions.clearQuotesAndParams(),
            ];

            const state = actions.reduce(tradingExchangeReducer, undefined);

            expect(state?.quotes).toEqual([]);
            expect(state?.quotesRequest).toBeUndefined();
            expect(state?.formValues).toBeUndefined();
            expect(state?.selectedQuote).toBeUndefined();
            expect(state?.amountLimits).toBeUndefined();
        });
    });

    describe('setTradingAccountKey', () => {
        it('clears the form values when the account key changes', () => {
            const actions = [
                tradingExchangeActions.setTradingAccountKey('account-1' as AccountKey),
                tradingExchangeActions.saveFormValues(FORM_VALUES),
                tradingExchangeActions.setTradingAccountKey('account-2' as AccountKey),
            ];

            const state = actions.reduce(tradingExchangeReducer, undefined);

            expect(state?.formValues).toBeUndefined();
        });

        it('keeps the form values when the same account key is set', () => {
            const actions = [
                tradingExchangeActions.setTradingAccountKey('account-1' as AccountKey),
                tradingExchangeActions.saveFormValues(FORM_VALUES),
                tradingExchangeActions.setTradingAccountKey('account-1' as AccountKey),
            ];

            const state = actions.reduce(tradingExchangeReducer, undefined);

            expect(state?.formValues).toEqual(FORM_VALUES);
        });

        it('clears selected quote, quotes and form values when the account key is cleared', () => {
            const actions = [
                tradingExchangeActions.saveSelectedQuote(changellyExchangeQuote),
                tradingExchangeActions.saveQuotes([changellyExchangeQuote]),
                tradingExchangeActions.saveFormValues(FORM_VALUES),
                tradingExchangeActions.setTradingAccountKey('account-1' as AccountKey),
                tradingExchangeActions.setTradingAccountKey(undefined),
            ];

            const state = actions.reduce(tradingExchangeReducer, undefined);

            expect(state?.tradingAccountKey).toBeUndefined();
            expect(state?.selectedQuote).toBeUndefined();
            expect(state?.quotes).toEqual([]);
            expect(state?.quotesRequest).toBeUndefined();
            expect(state?.formValues).toBeUndefined();
        });
    });
});
