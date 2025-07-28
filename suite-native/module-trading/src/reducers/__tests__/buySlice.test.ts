import { BuyTrade, CryptoId } from 'invity-api';

import { Address } from '@trezor/blockchain-link-types';

import quotes from '../../__fixtures__/buyQuotes.json';
import { TradingBuyState, buyActions, buyInitialState, buyReducer } from '../buySlice';

describe('buySlice', () => {
    describe('setReceiveAddress', () => {
        it('should set buy receive address', () => {
            const address = { address: 'bc1qxyz' } as Address;
            const state = buyReducer(undefined, buyActions.setReceiveAddress(address));

            expect(state.receiveAddress).toEqual(address);
        });

        it('should set buy receive address to undefined', () => {
            const state = buyReducer(undefined, buyActions.setReceiveAddress(undefined));

            expect(state.receiveAddress).toBeUndefined();
        });
    });

    describe('clearState', () => {
        it('should clear buy state', () => {
            const prevState: TradingBuyState = {
                ...buyInitialState,
                tradingAccountKey: 'account-key',
                receiveAddress: {
                    address: 'bc1qxyz',
                } as Address,
                quotesRequest: {
                    wantCrypto: true,
                    receiveCurrency: 'btc' as CryptoId,
                    fiatCurrency: 'czk',
                    country: 'CZ',
                },
                quotes: quotes as BuyTrade[],
                selectedQuote: quotes[0] as BuyTrade,
                amountLimits: {
                    currency: 'CZK',
                    minFiat: '100',
                },
            };

            const state = buyReducer(prevState, buyActions.clearState());

            expect(state).toEqual({
                quotes: [],
                isFromRedirect: false,
                isLoading: false,
            });
        });
    });

    describe('clearQuotesAndQuotesRequest', () => {
        it('should clear quotes and quotesRequest', () => {
            const prevState: TradingBuyState = {
                ...buyInitialState,
                quotesRequest: {
                    wantCrypto: true,
                    receiveCurrency: 'btc' as CryptoId,
                    fiatCurrency: 'czk',
                    country: 'CZ',
                },
                quotes: quotes as BuyTrade[],
            };

            const state = buyReducer(prevState, buyActions.clearQuotesAndQuotesRequest());

            expect(state.quotes).toEqual([]);
            expect(state.quotesRequest).toBeUndefined();
        });
    });

    describe('assetChanged', () => {
        it('should clear tradingAccountKey and receiveAddress', () => {
            const prevState: TradingBuyState = {
                ...buyInitialState,
                tradingAccountKey: 'account-key',
                receiveAddress: {
                    address: 'bc1qxyz',
                } as Address,
            };

            const state = buyReducer(prevState, buyActions.assetChanged());

            expect(state.tradingAccountKey).toBeUndefined();
            expect(state.receiveAddress).toBeUndefined();
        });

        it('should clear buy amountLimits', () => {
            const prevState: TradingBuyState = {
                ...buyInitialState,
                amountLimits: {
                    currency: 'CZK',
                    minFiat: '100',
                    maxCrypto: '0.01',
                    maxFiat: '1000',
                    minCrypto: '0.0001',
                },
            };

            const state = buyReducer(prevState, buyActions.assetChanged());

            expect(state.amountLimits).toBeUndefined();
        });

        it('should clear quotesRequest', () => {
            const prevState: TradingBuyState = {
                ...buyInitialState,
                quotesRequest: {
                    wantCrypto: true,
                    receiveCurrency: 'btc' as CryptoId,
                    fiatCurrency: 'czk',
                    country: 'CZ',
                },
            };

            const state = buyReducer(prevState, buyActions.assetChanged());

            expect(state.quotesRequest).toBeUndefined();
        });
    });

    describe('fiatCurrencyChanged', () => {
        it('should clear buy amountLimits', () => {
            const prevState: TradingBuyState = {
                ...buyInitialState,
                amountLimits: {
                    currency: 'CZK',
                    minFiat: '100',
                    maxCrypto: '0.01',
                    maxFiat: '1000',
                    minCrypto: '0.0001',
                },
            };

            const state = buyReducer(prevState, buyActions.fiatCurrencyChanged());

            expect(state.amountLimits).toBeUndefined();
        });

        it('should clear quotesRequest', () => {
            const prevState: TradingBuyState = {
                ...buyInitialState,
                quotesRequest: {
                    wantCrypto: true,
                    receiveCurrency: 'btc' as CryptoId,
                    fiatCurrency: 'czk',
                    country: 'CZ',
                },
            };

            const state = buyReducer(prevState, buyActions.fiatCurrencyChanged());

            expect(state.quotesRequest).toBeUndefined();
        });
    });
});
