import { type CryptoId, type ExchangeTrade, type ExchangeTradeQuoteRequest } from 'invity-api';

import { createMockDispatch } from '@trezor/redux-utils/mocks';

import {
    type FetchSelectedProviderQuoteThunkState,
    fetchSelectedProviderQuoteThunk,
} from './fetchSelectedProviderQuoteThunk';
import { tradingExchangeActions } from '../../reducers/exchangeReducer';
import { initialState } from '../../reducers/tradingCommonReducer';
import { tradeApi } from '../../tradeApi';

jest.mock('../../tradeApi');

const quotesRequest: ExchangeTradeQuoteRequest = {
    send: 'solana' as CryptoId,
    receive: 'solana--EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' as CryptoId,
    sendStringAmount: '0.01',
    dex: 'enable',
};

const buildQuote = (exchange: string, data: string): ExchangeTrade => ({
    exchange,
    send: quotesRequest.send,
    receive: quotesRequest.receive,
    sendStringAmount: quotesRequest.sendStringAmount,
    receiveStringAmount: '1',
    isDex: true,
    dexTx: { from: 'from', to: 'to', data, value: '0' },
});

const selectedQuote = buildQuote('lifi', 'stale');

const buildState = (
    exchange: Partial<FetchSelectedProviderQuoteThunkState['wallet']['trading']['exchange']>,
): FetchSelectedProviderQuoteThunkState => ({
    wallet: {
        trading: {
            ...initialState,
            exchange: { ...initialState.exchange, selectedQuote, quotesRequest, ...exchange },
        },
    },
});

const runThunk = async (state: FetchSelectedProviderQuoteThunkState) => {
    const getState = () => state;
    const { actions, dispatch } = createMockDispatch({ getState, extra: {} });
    const result = await dispatch(fetchSelectedProviderQuoteThunk());

    return { result, actions };
};

describe('fetchSelectedProviderQuoteThunk', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('returns the fresh quote of the selected provider and saves the quotes', async () => {
        const freshQuote = buildQuote('lifi', 'fresh');
        const otherQuote = buildQuote('swapkit', 'other');
        jest.mocked(tradeApi.getExchangeQuotes).mockResolvedValue([otherQuote, freshQuote]);

        const { result, actions } = await runThunk(buildState({}));

        expect(tradeApi.getExchangeQuotes).toHaveBeenCalledWith(quotesRequest, expect.anything());
        expect(result).toMatchObject({
            type: fetchSelectedProviderQuoteThunk.fulfilled.type,
            payload: expect.objectContaining({ exchange: 'lifi', dexTx: freshQuote.dexTx }),
        });
        expect(actions).toContainEqual(
            expect.objectContaining({ type: tradingExchangeActions.saveQuotes.type }),
        );
        expect(actions).not.toContainEqual(
            expect.objectContaining({ type: tradingExchangeActions.saveSelectedQuote.type }),
        );
    });

    it('rejects when the provider no longer offers a quote', async () => {
        jest.mocked(tradeApi.getExchangeQuotes).mockResolvedValue([buildQuote('swapkit', 'other')]);

        const { result } = await runThunk(buildState({}));

        expect(result).toMatchObject({
            type: fetchSelectedProviderQuoteThunk.rejected.type,
            payload: { type: 'error', error: { id: 'TR_TRADING_REFRESH_TRANSACTION_FAILED' } },
        });
    });

    it('rejects when the quotes request fails', async () => {
        jest.mocked(tradeApi.getExchangeQuotes).mockRejectedValue(new Error('offline'));

        const { result } = await runThunk(buildState({}));

        expect(result.type).toBe(fetchSelectedProviderQuoteThunk.rejected.type);
    });

    it('rejects without a saved quotes request', async () => {
        const { result } = await runThunk(buildState({ quotesRequest: undefined }));

        expect(result.type).toBe(fetchSelectedProviderQuoteThunk.rejected.type);
        expect(tradeApi.getExchangeQuotes).not.toHaveBeenCalled();
    });
});
