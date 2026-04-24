import { combineReducers } from '@reduxjs/toolkit';
import type { ExchangeTrade } from 'invity-api';

import { configureMockStore, extraDependenciesCommonMock } from '@suite-common/test-utils';
import type { Account } from '@suite-common/wallet-types';
import { type AccountAddresses } from '@trezor/connect';

import { accountBtc, accountEth } from '../../../__fixtures__/utils';
import { invityAPI } from '../../../invityAPI';
import { initialState } from '../../../reducers/tradingCommonReducer';
import { prepareTradingReducer } from '../../../reducers/tradingReducer';
import { getUnusedAddressFromAccount } from '../../../utils';
import { prefetchDexQuoteApprovalThunk } from '../prefetchDexQuoteApprovalThunk';

jest.mock('../../../invityAPI');

const tradingReducer = prepareTradingReducer(extraDependenciesCommonMock);

const getExchangeTrade = (quoteId: string): ExchangeTrade =>
    ({
        quoteId,
        orderId: `${quoteId}-order`,
        exchange: '1inch',
        isDex: true,
        send: 'ethereum--0xa0b73e1ff0b80914ab6fe0444e65848c4c34450b',
        sendStringAmount: '1',
        receive: 'ethereum--0x6b175474e89094c44da98b954eedeac495271d0f',
        receiveStringAmount: '100',
        rate: 100,
    }) as ExchangeTrade;

const getStore = (quotes: ExchangeTrade[]) =>
    configureMockStore({
        extra: {},
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
                        quotes,
                    },
                },
            },
        },
    });

describe('prefetchDexQuoteApprovalThunk', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('returns early and does not call the API when trade has no quoteId', async () => {
        const quote = {
            ...getExchangeTrade('quote-1'),
            quoteId: undefined,
        } as unknown as ExchangeTrade;
        const store = getStore([quote]);
        const doExchangeTrade = jest.spyOn(invityAPI, 'doExchangeTrade');

        const result = await store.dispatch(
            prefetchDexQuoteApprovalThunk({
                account: accountEth as Account,
                trade: quote,
            }),
        );

        expect(result.meta.requestStatus).toBe('fulfilled');
        expect(result.payload).toBeUndefined();
        expect(doExchangeTrade).not.toHaveBeenCalled();
        expect(
            store.getState().wallet.trading.exchange.dexQuoteApprovalPrefetchLoadingQuoteId,
        ).toBeUndefined();
    });

    it('returns early and does not call the API when there is no from address and trade has no fromAddress', async () => {
        const quote = getExchangeTrade('quote-1');
        const accountWithoutSpendAddress = {
            ...accountBtc,
            addresses: { unused: [], change: [], main: [], used: [] } as AccountAddresses,
        } as Account;
        const store = getStore([quote]);
        const doExchangeTrade = jest.spyOn(invityAPI, 'doExchangeTrade');

        const result = await store.dispatch(
            prefetchDexQuoteApprovalThunk({
                account: accountWithoutSpendAddress,
                trade: { ...quote, fromAddress: undefined },
            }),
        );

        expect(result.meta.requestStatus).toBe('fulfilled');
        expect(result.payload).toBeUndefined();
        expect(doExchangeTrade).not.toHaveBeenCalled();
        expect(
            store.getState().wallet.trading.exchange.dexQuoteApprovalPrefetchLoadingQuoteId,
        ).toBeUndefined();
    });

    it('does not overwrite existing quote with error-only response', async () => {
        const quote = getExchangeTrade('quote-1');
        const store = getStore([quote]);

        jest.spyOn(invityAPI, 'doExchangeTrade').mockResolvedValueOnce({
            error: 'some-error',
        } as ExchangeTrade);

        const result = await store.dispatch(
            prefetchDexQuoteApprovalThunk({
                account: accountEth as Account,
                trade: quote,
            }),
        );

        expect(result.meta.requestStatus).toBe('fulfilled');
        expect(result.payload).toBeUndefined();
        expect(store.getState().wallet.trading.exchange.quotes).toEqual([quote]);
        expect(
            store.getState().wallet.trading.exchange.dexQuoteApprovalPrefetchLoadingQuoteId,
        ).toBeUndefined();
    });

    it('returns undefined and does not update quotes when API returns a falsy response', async () => {
        const quote = getExchangeTrade('quote-1');
        const store = getStore([quote]);

        jest.spyOn(invityAPI, 'doExchangeTrade').mockResolvedValueOnce(
            null as unknown as ExchangeTrade,
        );

        const result = await store.dispatch(
            prefetchDexQuoteApprovalThunk({
                account: accountEth as Account,
                trade: quote,
            }),
        );

        expect(result.meta.requestStatus).toBe('fulfilled');
        expect(result.payload).toBeUndefined();
        expect(store.getState().wallet.trading.exchange.quotes).toEqual([quote]);
        expect(
            store.getState().wallet.trading.exchange.dexQuoteApprovalPrefetchLoadingQuoteId,
        ).toBeUndefined();
    });

    it('merges successful response into stored quote and calls approval prefetch on the API', async () => {
        const quote = getExchangeTrade('quote-1');
        const store = getStore([quote]);
        const { address: fromAccount } = getUnusedAddressFromAccount(accountEth as Account);

        const doExchangeTrade = jest.spyOn(invityAPI, 'doExchangeTrade').mockResolvedValueOnce({
            quoteId: quote.quoteId,
            status: 'APPROVAL_REQ',
            preapprovedStringAmount: '0',
        } as ExchangeTrade);

        await store.dispatch(
            prefetchDexQuoteApprovalThunk({
                account: accountEth as Account,
                trade: quote,
            }),
        );

        expect(doExchangeTrade).toHaveBeenCalledWith({
            trade: { ...quote, fromAddress: fromAccount },
            receiveAddress: fromAccount,
            refundAddress: fromAccount,
            returnUrl: undefined,
            approvalFlow: true,
        });

        const [updatedQuote] = store.getState().wallet.trading.exchange.quotes;
        expect(updatedQuote).toEqual(
            expect.objectContaining({
                quoteId: quote.quoteId,
                sendStringAmount: quote.sendStringAmount,
                status: 'APPROVAL_REQ',
                preapprovedStringAmount: '0',
            }),
        );
        expect(
            store.getState().wallet.trading.exchange.dexQuoteApprovalPrefetchLoadingQuoteId,
        ).toBeUndefined();
    });

    it('passes through trade with fromAddress and receiveAddress for the API call', async () => {
        const fromOnQuote = '0xfrom';
        const receiveOnQuote = '0xreceive';
        const quote = {
            ...getExchangeTrade('quote-1'),
            fromAddress: fromOnQuote,
            receiveAddress: receiveOnQuote,
        } as ExchangeTrade;
        const store = getStore([quote]);
        const { address: fromAccount } = getUnusedAddressFromAccount(accountEth as Account);

        const doExchangeTrade = jest.spyOn(invityAPI, 'doExchangeTrade').mockResolvedValueOnce({
            quoteId: quote.quoteId,
        } as ExchangeTrade);

        await store.dispatch(
            prefetchDexQuoteApprovalThunk({
                account: accountEth as Account,
                trade: quote,
            }),
        );

        expect(doExchangeTrade).toHaveBeenCalledWith({
            trade: quote,
            receiveAddress: receiveOnQuote,
            refundAddress: fromAccount,
            returnUrl: undefined,
            approvalFlow: true,
        });
    });

    it('tracks loading state correctly for concurrent prefetches', async () => {
        const quoteA = getExchangeTrade('quote-a');
        const quoteB = getExchangeTrade('quote-b');
        const store = getStore([quoteA, quoteB]);

        let resolveA: (() => void) | undefined;
        let resolveB: (() => void) | undefined;

        jest.spyOn(invityAPI, 'doExchangeTrade').mockImplementation(
            ({ trade }: { trade: ExchangeTrade }) =>
                new Promise(resolve => {
                    const done = () => resolve({ quoteId: trade.quoteId } as ExchangeTrade);
                    if (trade.quoteId === quoteA.quoteId) {
                        resolveA = done;
                    } else {
                        resolveB = done;
                    }
                }),
        );

        const promiseA = store.dispatch(
            prefetchDexQuoteApprovalThunk({
                account: accountEth as Account,
                trade: quoteA,
            }),
        );
        const promiseB = store.dispatch(
            prefetchDexQuoteApprovalThunk({
                account: accountEth as Account,
                trade: quoteB,
            }),
        );

        // Each dispatch sets loading to that quote id; the latest wins while both are in flight
        expect(
            !!store.getState().wallet.trading.exchange.dexQuoteApprovalPrefetchLoadingQuoteId,
        ).toBe(true);
        expect(
            store.getState().wallet.trading.exchange.dexQuoteApprovalPrefetchLoadingQuoteId,
        ).toBe(quoteB.quoteId);

        resolveA?.();
        await promiseA;
        expect(
            !!store.getState().wallet.trading.exchange.dexQuoteApprovalPrefetchLoadingQuoteId,
        ).toBe(true);
        expect(
            store.getState().wallet.trading.exchange.dexQuoteApprovalPrefetchLoadingQuoteId,
        ).toBe(quoteB.quoteId);

        resolveB?.();
        await promiseB;
        expect(
            !!store.getState().wallet.trading.exchange.dexQuoteApprovalPrefetchLoadingQuoteId,
        ).toBe(false);
        expect(
            store.getState().wallet.trading.exchange.dexQuoteApprovalPrefetchLoadingQuoteId,
        ).toBe(undefined);
    });
});
