import { type Store, createAction } from '@reduxjs/toolkit';

import { TRADE_API_RELOAD_QUOTES_AFTER_SECONDS, tradingActions } from '@suite-common/trading';
import { act, waitFor } from '@suite-native/test-utils-store';
import { type TradingRootState } from '@suite-native/trading-state';
import { type AbortablePromise } from '@suite-native/trading-types';
import { mock } from '@trezor/dependency-injection';

import {
    type UseQuotesRequestParams,
    getQuotesRequestKey,
    useQuotesRequest,
} from './useQuotesRequest';
import {
    createTradingTestStore,
    renderHookWithTradingProvider,
} from '../../test-utils/tradingTestUtils';

let mockIsFocused = true;
let mockShouldRunDebouncedCallback = true;

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useIsFocused: () => mockIsFocused,
}));

jest.mock('@trezor/react-utils', () => {
    const originalModule = jest.requireActual('@trezor/react-utils');

    return {
        ...originalModule,
        useDebounce: () => (fn: () => unknown) =>
            mockShouldRunDebouncedCallback ? fn() : undefined,
    };
});

const clearQuotesAction = createAction('test/clearQuotes');
const clearStateAction = createAction('test/clearState');

const createQuotesPromise = (action: unknown = {}): AbortablePromise =>
    Object.assign(Promise.resolve(action), { abort: mock<AbortablePromise['abort']>() });

const createFulfilledAction = (payload: unknown[]) => ({
    type: 'test/handleRequest/fulfilled',
    payload,
    meta: { requestStatus: 'fulfilled', requestId: 'test-request-id' },
});

const createRejectedAction = () => ({
    type: 'test/handleRequest/rejected',
    payload: undefined,
    meta: { requestStatus: 'rejected', requestId: 'test-request-id' },
});

describe('getQuotesRequestKey', () => {
    it('should return undefined when fetching is not allowed', () => {
        expect(getQuotesRequestKey(false, { amount: '1' })).toBeUndefined();
    });

    it('should return the same key for the same params', () => {
        expect(getQuotesRequestKey(true, { amount: '1', asset: 'bitcoin' })).toBe(
            getQuotesRequestKey(true, { amount: '1', asset: 'bitcoin' }),
        );
    });

    it('should return a different key when a param changes', () => {
        expect(getQuotesRequestKey(true, { amount: '1' })).not.toBe(
            getQuotesRequestKey(true, { amount: '2' }),
        );
    });
});

describe('useQuotesRequest', () => {
    let store: Store<TradingRootState>;

    const renderUseQuotesRequest = (params: Partial<UseQuotesRequestParams>) =>
        renderHookWithTradingProvider((props: UseQuotesRequestParams) => useQuotesRequest(props), {
            services: { store },
            initialProps: {
                requestKey: undefined,
                fetchQuotes: mock<UseQuotesRequestParams['fetchQuotes']>(() =>
                    createQuotesPromise(),
                ),
                isLoading: false,
                hasQuotes: false,
                clearQuotesAction,
                clearStateAction,
                ...params,
            },
        });

    beforeEach(() => {
        store = createTradingTestStore();
        mockIsFocused = true;
        mockShouldRunDebouncedCallback = true;
    });

    it('should not fetch quotes without a request key', async () => {
        const fetchQuotes = mock<UseQuotesRequestParams['fetchQuotes']>();
        await renderUseQuotesRequest({ fetchQuotes });

        expect(fetchQuotes).not.toHaveBeenCalled();
    });

    it('should fetch quotes once a request key is available', async () => {
        const fetchQuotes = mock<UseQuotesRequestParams['fetchQuotes']>(() =>
            createQuotesPromise(),
        );
        const { rerender } = await renderUseQuotesRequest({ fetchQuotes });

        await act(() => {
            rerender({
                requestKey: 'key-1',
                fetchQuotes,
                isLoading: false,
                hasQuotes: false,
                clearQuotesAction,
                clearStateAction,
            });
        });

        expect(fetchQuotes).toHaveBeenCalledTimes(1);
    });

    it('should not fetch quotes again when the request key stays the same', async () => {
        const fetchQuotes = mock<UseQuotesRequestParams['fetchQuotes']>(() =>
            createQuotesPromise(),
        );
        const params: UseQuotesRequestParams = {
            requestKey: 'key-1',
            fetchQuotes,
            isLoading: false,
            hasQuotes: false,
            clearQuotesAction,
            clearStateAction,
        };
        const { rerender } = await renderUseQuotesRequest(params);

        await act(() => {
            rerender({ ...params, isLoading: true });
        });

        expect(fetchQuotes).toHaveBeenCalledTimes(1);
    });

    it('should abort the previous request when the request key changes', async () => {
        const firstQuotesPromise = createQuotesPromise();
        const fetchQuotes = mock<UseQuotesRequestParams['fetchQuotes']>()
            .mockReturnValueOnce(firstQuotesPromise)
            .mockReturnValueOnce(createQuotesPromise());
        const params: UseQuotesRequestParams = {
            requestKey: 'key-1',
            fetchQuotes,
            isLoading: false,
            hasQuotes: false,
            clearQuotesAction,
            clearStateAction,
        };
        const { rerender } = await renderUseQuotesRequest(params);

        await act(() => {
            rerender({ ...params, requestKey: 'key-2' });
        });

        expect(firstQuotesPromise.abort).toHaveBeenCalledWith(
            'Request was replaced by another one.',
        );
        expect(fetchQuotes).toHaveBeenCalledTimes(2);
    });

    it('should report received quotes only for a fulfilled non-empty response', async () => {
        const onQuotesReceived = mock<NonNullable<UseQuotesRequestParams['onQuotesReceived']>>();
        const fetchQuotes = mock<UseQuotesRequestParams['fetchQuotes']>()
            .mockReturnValueOnce(createQuotesPromise(createFulfilledAction([{ id: 'quote' }])))
            .mockReturnValueOnce(createQuotesPromise(createFulfilledAction([])))
            .mockReturnValueOnce(createQuotesPromise(createRejectedAction()));
        const params: UseQuotesRequestParams = {
            requestKey: 'key-1',
            fetchQuotes,
            onQuotesReceived,
            isLoading: false,
            hasQuotes: false,
            clearQuotesAction,
            clearStateAction,
        };
        const { rerender } = await renderUseQuotesRequest(params);

        await act(() => {
            rerender({ ...params, requestKey: 'key-2' });
        });
        await act(() => {
            rerender({ ...params, requestKey: 'key-3' });
        });

        expect(fetchQuotes).toHaveBeenCalledTimes(3);
        expect(onQuotesReceived).toHaveBeenCalledTimes(1);
    });

    it('should clear quotes when the request key becomes undefined', async () => {
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const params: UseQuotesRequestParams = {
            requestKey: 'key-1',
            fetchQuotes: mock<UseQuotesRequestParams['fetchQuotes']>(() => createQuotesPromise()),
            isLoading: false,
            hasQuotes: true,
            clearQuotesAction,
            clearStateAction,
        };
        const { rerender } = await renderUseQuotesRequest(params);

        await act(() => {
            rerender({ ...params, requestKey: undefined });
        });

        expect(dispatchSpy).toHaveBeenCalledWith(clearQuotesAction());
    });

    it('should clear state on unmount', async () => {
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const { unmount } = await renderUseQuotesRequest({ requestKey: 'key-1' });

        await unmount();

        expect(dispatchSpy).toHaveBeenCalledWith(clearStateAction());
    });

    it('should refetch quotes when the refetch time elapsed', async () => {
        const fetchQuotes = mock<UseQuotesRequestParams['fetchQuotes']>(() =>
            createQuotesPromise(),
        );
        await renderUseQuotesRequest({ requestKey: 'key-1', fetchQuotes });

        await act(() => {
            store.dispatch(
                tradingActions.setRefetchQuotesTimestamp(
                    Date.now() - TRADE_API_RELOAD_QUOTES_AFTER_SECONDS * 1000,
                ),
            );
        });

        await waitFor(() => {
            expect(fetchQuotes).toHaveBeenCalledTimes(2);
        });
    });

    it('should not refetch quotes when the refetch time elapsed without a request key', async () => {
        const fetchQuotes = mock<UseQuotesRequestParams['fetchQuotes']>();
        await renderUseQuotesRequest({ fetchQuotes });

        await act(() => {
            store.dispatch(
                tradingActions.setRefetchQuotesTimestamp(
                    Date.now() - TRADE_API_RELOAD_QUOTES_AFTER_SECONDS * 1000,
                ),
            );
        });
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(fetchQuotes).not.toHaveBeenCalled();
    });

    describe('screen focus', () => {
        const getParams = (
            fetchQuotes: UseQuotesRequestParams['fetchQuotes'],
            requestKey: string | undefined,
        ): UseQuotesRequestParams => ({
            requestKey,
            fetchQuotes,
            isLoading: false,
            hasQuotes: false,
            clearQuotesAction,
            clearStateAction,
        });

        it('should abort the pending request when the screen loses focus', async () => {
            const quotesPromise = createQuotesPromise();
            const fetchQuotes = mock<UseQuotesRequestParams['fetchQuotes']>(() => quotesPromise);
            const { rerender } = await renderUseQuotesRequest(getParams(fetchQuotes, 'key-1'));

            mockIsFocused = false;
            await act(() => {
                rerender(getParams(fetchQuotes, 'key-1'));
            });

            expect(quotesPromise.abort).toHaveBeenCalledWith('Screen lost focus.');
        });

        it('should not fetch quotes while the screen is not focused', async () => {
            mockIsFocused = false;
            const fetchQuotes = mock<UseQuotesRequestParams['fetchQuotes']>(() =>
                createQuotesPromise(),
            );
            const { rerender } = await renderUseQuotesRequest(getParams(fetchQuotes, 'key-1'));

            await act(() => {
                rerender(getParams(fetchQuotes, 'key-2'));
            });

            expect(fetchQuotes).not.toHaveBeenCalled();
        });

        it('should fetch quotes immediately when the screen regains focus', async () => {
            const fetchQuotes = mock<UseQuotesRequestParams['fetchQuotes']>(() =>
                createQuotesPromise(),
            );
            const { rerender } = await renderUseQuotesRequest(getParams(fetchQuotes, 'key-1'));
            fetchQuotes.mockClear();

            mockIsFocused = false;
            await act(() => {
                rerender(getParams(fetchQuotes, 'key-1'));
            });

            // A debounced request would never run, so only an immediate fetch can be observed.
            mockShouldRunDebouncedCallback = false;
            mockIsFocused = true;
            await act(() => {
                rerender(getParams(fetchQuotes, 'key-1'));
            });

            expect(fetchQuotes).toHaveBeenCalledTimes(1);
        });

        it('should not fetch quotes when the screen regains focus without a request key', async () => {
            const fetchQuotes = mock<UseQuotesRequestParams['fetchQuotes']>();
            const { rerender } = await renderUseQuotesRequest(getParams(fetchQuotes, undefined));

            mockIsFocused = false;
            await act(() => {
                rerender(getParams(fetchQuotes, undefined));
            });
            mockIsFocused = true;
            await act(() => {
                rerender(getParams(fetchQuotes, undefined));
            });

            expect(fetchQuotes).not.toHaveBeenCalled();
        });

        it('should not refetch quotes when the refetch time elapsed while the screen is not focused', async () => {
            const fetchQuotes = mock<UseQuotesRequestParams['fetchQuotes']>(() =>
                createQuotesPromise(),
            );
            const { rerender } = await renderUseQuotesRequest(getParams(fetchQuotes, 'key-1'));
            fetchQuotes.mockClear();

            mockIsFocused = false;
            await act(() => {
                rerender(getParams(fetchQuotes, 'key-1'));
            });
            await act(() => {
                store.dispatch(
                    tradingActions.setRefetchQuotesTimestamp(
                        Date.now() - TRADE_API_RELOAD_QUOTES_AFTER_SECONDS * 1000,
                    ),
                );
            });
            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 0));
            });

            expect(fetchQuotes).not.toHaveBeenCalled();
        });
    });
});
