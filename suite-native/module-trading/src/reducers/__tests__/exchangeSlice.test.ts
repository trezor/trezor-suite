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
});
