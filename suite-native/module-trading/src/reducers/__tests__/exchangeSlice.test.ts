import { CryptoId } from 'invity-api';

import { Address } from '@trezor/blockchain-link-types';

import { exchangeQuotes } from '../../__fixtures__/exchangeQuotes';
import {
    TradingExchangeState,
    exchangeActions,
    exchangeInitialState,
    exchangeReducer,
} from '../exchangeSlice';

describe('exchangeSlice', () => {
    it('should have correct initial state', () => {
        const state = exchangeReducer(undefined, { type: 'unknown_action' });

        expect(state).toEqual({
            quotes: [],
            isFromRedirect: false,
            isLoading: false,
            formStep: 'RECEIVING_ADDRESS',
        });
    });

    describe('setReceiveAddress', () => {
        it('should set buy receive address', () => {
            const address = { address: 'bc1qxyz' } as Address;
            const state = exchangeReducer(undefined, exchangeActions.setReceiveAddress(address));

            expect(state.receiveAddress).toEqual(address);
        });

        it('should set buy receive address to undefined', () => {
            const state = exchangeReducer(undefined, exchangeActions.setReceiveAddress(undefined));

            expect(state.receiveAddress).toBeUndefined();
        });
    });

    describe('clearState', () => {
        it('should clear exchange state', () => {
            const prevState: TradingExchangeState = {
                ...exchangeInitialState,
                receiveAddress: { address: 'bc1qxyz' } as Address,
                tradingAccountKey: 'account-key1',
                receiveAccountKey: 'account-key2',
                quotesRequest: {
                    send: 'bitcoin' as CryptoId,
                    receive: 'ethereum' as CryptoId,
                },
                quotes: exchangeQuotes,
                selectedQuote: exchangeQuotes[0],
                amountLimits: {
                    currency: 'BTC',
                    minCrypto: '0.001',
                    maxCrypto: '10',
                },
            };

            const state = exchangeReducer(prevState, exchangeActions.clearState());

            expect(state).toEqual({
                quotes: [],
                formStep: 'RECEIVING_ADDRESS',
                isFromRedirect: false,
                isLoading: false,
            });
        });
    });

    describe('clearQuotesAndQuotesRequest', () => {
        it('should clear quotes and quotesRequest', () => {
            const prevState: TradingExchangeState = {
                ...exchangeInitialState,
                quotesRequest: {
                    send: 'bitcoin' as CryptoId,
                    receive: 'ethereum' as CryptoId,
                },
                quotes: exchangeQuotes,
            };

            const state = exchangeReducer(prevState, exchangeActions.clearQuotesAndQuotesRequest());

            expect(state.quotes).toEqual([]);
            expect(state.quotesRequest).toBeUndefined();
        });
    });

    describe('sendAssetChanged', () => {
        it('should clear amount limits and quotes request data', () => {
            const prevState: TradingExchangeState = {
                ...exchangeInitialState,
                amountLimits: {
                    currency: 'BTC',
                    minCrypto: '0.001',
                    maxCrypto: '10',
                },
                quotesRequest: {
                    send: 'bitcoin' as CryptoId,
                    receive: 'ethereum' as CryptoId,
                },
            };

            const state = exchangeReducer(prevState, exchangeActions.sendAssetChanged());

            expect(state.amountLimits).toBeUndefined();
            expect(state.quotesRequest).toBeUndefined();
        });
    });

    describe('receiveAssetChanged', () => {
        it('should clear amount limits, quotes request and receive account info', () => {
            const prevState: TradingExchangeState = {
                ...exchangeInitialState,
                amountLimits: {
                    currency: 'BTC',
                    minCrypto: '0.001',
                    maxCrypto: '10',
                },
                quotesRequest: {
                    send: 'bitcoin' as CryptoId,
                    receive: 'ethereum' as CryptoId,
                },
                receiveAccountKey: 'account-key1',
                receiveAddress: { address: 'bc1qxyz' } as Address,
            };

            const state = exchangeReducer(prevState, exchangeActions.receiveAssetChanged());

            expect(state.amountLimits).toBeUndefined();
            expect(state.quotesRequest).toBeUndefined();
            expect(state.receiveAccountKey).toBeUndefined();
            expect(state.receiveAddress).toBeUndefined();
        });
    });
});
