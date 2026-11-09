import { combineReducers } from '@reduxjs/toolkit';
import { type CryptoId, type ExchangeTrade, type ExchangeTradeQuoteRequest } from 'invity-api';

import { createTestCompositionRoot } from '@suite-common/test-utils';
import { mockActionType } from '@trezor/redux-utils/mocks';

import { setBridgeSpeedThunk } from './setBridgeSpeedThunk';
import { type TradingRootState, initialState } from '../../reducers/tradingCommonReducer';
import { prepareTradingReducer } from '../../reducers/tradingReducer';
import { selectTradingExchangeBridgeSpeed } from '../../selectors/tradingSelectors';
import { tradeApi } from '../../tradeApi';

jest.mock('../../tradeApi');

const tradingReducer = prepareTradingReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
});

const quotesRequest: ExchangeTradeQuoteRequest = {
    send: 'base--0x833589fcd6edb6e08f4c7c32d4f71b54bda02913' as CryptoId,
    receive: 'arbitrum--0xaf88d065e77c8cc2239327c5edb3a432268e5831' as CryptoId,
    sendStringAmount: '800',
    dex: 'enable',
    bridgeSpeed: 'standard',
};

const selectedQuote = {
    exchange: 'circle-cctp',
    send: quotesRequest.send,
    receive: quotesRequest.receive,
    sendStringAmount: quotesRequest.sendStringAmount,
    receiveStringAmount: '800',
    orderId: 'order-1',
    bridgeSpeed: 'standard',
} as ExchangeTrade;

const refreshedQuote = {
    ...selectedQuote,
    orderId: 'order-2',
    receiveStringAmount: '799.92',
    bridgeSpeed: 'fast',
} as ExchangeTrade;

describe('setBridgeSpeedThunk', () => {
    const buildStore = (
        exchangeOverrides: Partial<TradingRootState['wallet']['trading']['exchange']> = {},
    ) =>
        createTestCompositionRoot<Record<string, never>, TradingRootState>({
            reducer: combineReducers({
                wallet: combineReducers({
                    trading: tradingReducer,
                }),
            }),
            preloadedState: {
                wallet: {
                    trading: {
                        ...initialState,
                        exchange: {
                            ...initialState.exchange,
                            selectedQuote,
                            quotesRequest,
                            quotes: [selectedQuote],
                            ...exchangeOverrides,
                        },
                    },
                },
            },
        }).services.store;

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should request quotes with the new bridgeSpeed and select the refreshed quote', async () => {
        jest.mocked(tradeApi.getExchangeQuotes).mockResolvedValue([refreshedQuote]);

        const store = buildStore();
        const quote = await store.dispatch(setBridgeSpeedThunk({ bridgeSpeed: 'fast' })).unwrap();

        const state = store.getState().wallet.trading.exchange;

        expect(tradeApi.getExchangeQuotes).toHaveBeenCalledWith(
            expect.objectContaining({ bridgeSpeed: 'fast' }),
            expect.anything(),
        );
        expect(state.quotesRequest?.bridgeSpeed).toBe('fast');
        expect(state.selectedQuote).toEqual(refreshedQuote);
        expect(selectTradingExchangeBridgeSpeed(store.getState())).toBe('fast');
        expect(quote).toEqual(refreshedQuote);
    });

    it('should reject without fetching when quotesRequest is missing', async () => {
        const store = buildStore({ quotesRequest: undefined });

        await expect(
            store.dispatch(setBridgeSpeedThunk({ bridgeSpeed: 'fast' })).unwrap(),
        ).rejects.toEqual(
            expect.objectContaining({
                type: 'error',
            }),
        );
        expect(tradeApi.getExchangeQuotes).not.toHaveBeenCalled();
        expect(store.getState().wallet.trading.exchange.selectedQuote).toEqual(selectedQuote);
    });

    it('should restore the quote request and keep the selected quote when refresh fails', async () => {
        jest.mocked(tradeApi.getExchangeQuotes).mockResolvedValue([]);

        const store = buildStore();

        await expect(
            store.dispatch(setBridgeSpeedThunk({ bridgeSpeed: 'fast' })).unwrap(),
        ).rejects.toEqual(
            expect.objectContaining({
                type: 'error',
            }),
        );

        const state = store.getState().wallet.trading.exchange;
        expect(state.quotesRequest).toEqual(quotesRequest);
        expect(state.selectedQuote).toEqual(selectedQuote);
        expect(selectTradingExchangeBridgeSpeed(store.getState())).toBe('standard');
    });
});
