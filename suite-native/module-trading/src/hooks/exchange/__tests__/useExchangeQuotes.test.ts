import { CryptoId } from 'invity-api';

import {
    INVITY_API_RELOAD_QUOTES_AFTER_SECONDS,
    TradingAssetOption,
    tradingExchangeActions,
} from '@suite-common/trading';
import { EventType, analytics } from '@suite-native/analytics';
import {
    PreloadedState,
    TestStore,
    act,
    initStore,
    renderHookWithStoreProviderAsync,
} from '@suite-native/test-utils';
import {
    btcAsset,
    ethAsset,
    exchangeQuotes,
    getBtcAccount,
    getEthAccount,
    getInitializedTradingState,
    usdtAsset,
} from '@suite-native/trading-fixtures';
import { ExchangeFormValues } from '@suite-native/trading-types';
import { PROTO } from '@trezor/connect';

import { useExchangeForm } from '../useExchangeForm';
import { useExchangeQuotes } from '../useExchangeQuotes';

let mockTimeSpent: number;

jest.mock('@trezor/react-utils', () => {
    const originalModule = jest.requireActual('@trezor/react-utils');

    return {
        ...originalModule,
        useDebounce: () => (fn: () => unknown) => fn(),
        useTimer: () => {
            const timer = originalModule.useNullTimer();
            timer.timeSpent.seconds = mockTimeSpent;

            return timer;
        },
    };
});

jest.mock('@suite-common/trading', () => ({
    ...jest.requireActual('@suite-common/trading'),
    exchangeThunks: {
        handleRequestThunk: (payload: unknown) => ({
            type: 'handleRequestThunkMock',
            payload,
        }),
    },
}));

describe('useExchangeQuotes', () => {
    const getInitializedStore = (bitcoinAmountUnit = PROTO.AmountUnit.BITCOIN): TestStore => {
        const preloadedState: PreloadedState = {
            wallet: {
                trading: getInitializedTradingState(),
                accounts: [getBtcAccount(), getEthAccount()],
                settings: {
                    bitcoinAmountUnit,
                },
            },
        };

        return initStore(preloadedState).store;
    };

    const renderUseExchangeQuotes = (store: TestStore) =>
        renderHookWithStoreProviderAsync(
            () => {
                const form = useExchangeForm();
                const quotes = useExchangeQuotes(form);

                return { form, quotes };
            },
            { store },
        );

    beforeEach(() => {
        mockTimeSpent = 0;
    });

    it('should query quotes once all required data is selected', async () => {
        const store = await getInitializedStore();
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const { result } = await renderUseExchangeQuotes(store);
        const { form } = result.current;

        act(() => {
            form.setValue('sendAsset', btcAsset);
            form.setValue('receiveAsset', ethAsset);
            form.setValue('sendCryptoAmount', '0.1');
        });

        expect(dispatchSpy).toHaveBeenCalledWith({
            type: 'handleRequestThunkMock',
            payload: {
                formValues: {
                    outputs: [{ amount: '0.1' }],
                    receiveCryptoSelect: { id: 'ethereum' as CryptoId } satisfies Pick<
                        TradingAssetOption,
                        'id'
                    >,
                    sendCryptoSelect: { value: 'bitcoin' },
                },
                network: expect.objectContaining({
                    tradeCryptoId: 'bitcoin',
                }),
                timer: expect.any(Object),
                composeRequestCallback: expect.anything(),
                shouldSendInSats: false,
            },
        });

        await act(async () => {
            await result.current.quotes.quotesRequest;
        });
    });

    it('should respect sats setting', async () => {
        const store = await getInitializedStore(PROTO.AmountUnit.SATOSHI);
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const { result } = await renderUseExchangeQuotes(store);
        const { form } = result.current;

        act(() => {
            form.setValue('sendAsset', btcAsset);
            form.setValue('receiveAsset', ethAsset);
            form.setValue('sendCryptoAmount', '0.1');
        });

        expect(dispatchSpy).toHaveBeenCalledWith({
            type: 'handleRequestThunkMock',
            payload: expect.objectContaining({ shouldSendInSats: true }),
        });

        await act(async () => {
            await result.current.quotes.quotesRequest;
        });
    });

    it.each<string>(['0', '-1'])(
        'should not query quotes when amount is zero or less',
        async amount => {
            const store = await getInitializedStore();
            const dispatchSpy = jest.spyOn(store, 'dispatch');
            const { result } = await renderUseExchangeQuotes(store);
            const { form } = result.current;

            await act(async () => {
                form.setValue('sendAsset', btcAsset);
                form.setValue('receiveAsset', ethAsset);
                form.setValue('sendCryptoAmount', amount);
                // allow validations to run
                await Promise.resolve();
            });

            expect(dispatchSpy).not.toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'handleRequestThunkMock',
                }),
            );
        },
    );

    it('should not query quotes when form contains error', async () => {
        const store = await getInitializedStore();
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const { result } = await renderUseExchangeQuotes(store);
        const { form } = result.current;

        act(() => {
            form.setValue('sendAsset', btcAsset);
            form.setValue('receiveAsset', ethAsset);
            form.setValue('sendCryptoAmount', '10');
            form.setError('receiveAsset', {
                type: 'manual',
                message: 'VALIDATION_ERROR',
            });
        });

        expect(dispatchSpy).not.toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'handleRequestThunkMock',
            }),
        );

        // clean up form flush async validations
        await act(async () => {
            form.clearErrors();
            await form.trigger();
        });
    });

    it('should query quotes as soon as form contains no errors', async () => {
        const store = await getInitializedStore();
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const { result } = await renderUseExchangeQuotes(store);
        const { form } = result.current;

        act(() => {
            form.setValue('sendAsset', btcAsset);
            form.setValue('receiveAsset', btcAsset);
            form.setValue('sendCryptoAmount', '10');
            form.setError('receiveAsset', {
                type: 'manual',
                message: 'VALIDATION_ERROR',
            });
        });

        await act(async () => {
            form.clearErrors();
            await form.trigger();
        });

        expect(dispatchSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'handleRequestThunkMock',
            }),
        );

        await act(async () => {
            await result.current.quotes.quotesRequest;
        });
    });

    it('should clear exchange state on unmount', async () => {
        const store = await getInitializedStore();
        store.dispatch(tradingExchangeActions.saveQuotes(exchangeQuotes));
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const { unmount } = await renderUseExchangeQuotes(store);

        unmount();

        expect(dispatchSpy).toHaveBeenCalledWith({
            payload: undefined,
            type: 'tradingExchange/clearState',
        });
    });

    it.each<[keyof ExchangeFormValues, ExchangeFormValues[keyof ExchangeFormValues]]>([
        ['receiveAsset', usdtAsset],
        ['sendCryptoAmount', '0.2'],
        ['sendAccount', getBtcAccount('btc-account-2')],
    ])('should refetch quotes on %s value change', async (field, value) => {
        const store = await getInitializedStore();
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const { result } = await renderUseExchangeQuotes(store);
        const { form } = result.current;

        act(() => {
            form.setValue('sendAsset', btcAsset);
            form.setValue('receiveAsset', ethAsset);
            form.setValue('sendCryptoAmount', '1');
        });

        dispatchSpy.mockClear();

        act(() => {
            form.setValue(field, value);
        });

        expect(dispatchSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'handleRequestThunkMock',
            }),
        );

        await act(async () => {
            await result.current.quotes.quotesRequest;
        });
    });

    it('should re-fetch quotes when re-fetch time elapsed', async () => {
        const store = await getInitializedStore();
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const { result, rerender } = await renderUseExchangeQuotes(store);
        const { form } = result.current;

        act(() => {
            form.setValue('sendAsset', btcAsset);
            form.setValue('receiveAsset', ethAsset);
            form.setValue('sendCryptoAmount', '1');
        });

        dispatchSpy.mockClear();

        mockTimeSpent = INVITY_API_RELOAD_QUOTES_AFTER_SECONDS;
        rerender({});

        expect(dispatchSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'handleRequestThunkMock',
            }),
        );

        // clean up form flush async validations
        await act(async () => {
            form.clearErrors();
            await form.trigger();
        });
    });

    it('should not re-fetch quotes when re-fetch time elapsed but not all required data are available', async () => {
        const store = await getInitializedStore();
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const { result, rerender } = await renderUseExchangeQuotes(store);
        const { form } = result.current;

        act(() => {
            form.setValue('sendAsset', btcAsset);
        });

        dispatchSpy.mockClear();

        mockTimeSpent = INVITY_API_RELOAD_QUOTES_AFTER_SECONDS;
        rerender({});

        expect(dispatchSpy).not.toHaveBeenCalled();

        await act(async () => {
            await result.current.quotes.quotesRequest;
        });
    });

    it('should clear quotes when data in form becomes invalid', async () => {
        const store = await getInitializedStore();
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const { result } = await renderUseExchangeQuotes(store);
        const { form } = result.current;

        act(() => {
            form.setValue('sendAsset', btcAsset);
            form.setValue('receiveAsset', ethAsset);
            form.setValue('sendCryptoAmount', '1');
        });
        // handleRequestThunk is mocked, add quotes manually
        act(() => {
            store.dispatch(tradingExchangeActions.saveQuotes(exchangeQuotes));
        });

        dispatchSpy.mockClear();
        // clear some value to make form invalid
        act(() => {
            form.setValue('sendCryptoAmount', undefined);
        });

        expect(dispatchSpy).toHaveBeenCalledTimes(1);
        expect(dispatchSpy).toHaveBeenLastCalledWith({
            payload: undefined,
            type: 'tradingExchange/clearQuotesAndQuotesRequest',
        });
        expect(store.getState().wallet.trading.exchange.quotes).toEqual([]);

        await act(async () => {
            await result.current.quotes.quotesRequest;
        });
    });

    describe('analytics', () => {
        let analyticsReportSpy: jest.SpyInstance;

        const renderUseExchangeQuotesWithFilledForm = async (store: TestStore) => {
            const { result } = await renderUseExchangeQuotes(store);
            const { form } = result.current;

            act(() => {
                form.setValue('sendAsset', btcAsset);
                form.setValue('receiveAsset', ethAsset);
                form.setValue('sendCryptoAmount', '1');
            });

            analyticsReportSpy.mockClear();
            await act(async () => {
                await result.current.quotes.quotesRequest;
            });
        };

        beforeAll(() => {
            analyticsReportSpy = jest.spyOn(analytics, 'report').mockImplementation();
        });

        it('should report when quotes are fetched', async () => {
            const store = await getInitializedStore();
            jest.spyOn(store, 'dispatch').mockImplementation(() =>
                Promise.resolve({
                    meta: {
                        requestStatus: 'fulfilled',
                        requestId: 'test-request-id',
                    },
                    payload: exchangeQuotes,
                    type: '@trading-exchange/thunk/handleRequest/fulfilled',
                }),
            );

            await renderUseExchangeQuotesWithFilledForm(store);

            expect(analyticsReportSpy).toHaveBeenCalledWith({
                type: EventType.TradingQuoteReceived,
                payload: {
                    type: 'exchange',
                },
            });
        });

        it('should not report when empty quotes are returned', async () => {
            const store = await getInitializedStore();
            jest.spyOn(store, 'dispatch').mockImplementation(() =>
                Promise.resolve({
                    meta: {
                        requestStatus: 'fulfilled',
                        requestId: 'test-request-id',
                    },
                    payload: [],
                    type: '@trading-exchange/thunk/handleRequest/fulfilled',
                }),
            );

            await renderUseExchangeQuotesWithFilledForm(store);

            expect(analyticsReportSpy).not.toHaveBeenCalled();
        });

        it('should not report when handleRequestThunk rejected', async () => {
            const store = await getInitializedStore();
            jest.spyOn(store, 'dispatch').mockImplementation(() =>
                Promise.resolve({
                    meta: {
                        requestStatus: 'rejected',
                        requestId: 'test-request-id',
                    },
                    payload: exchangeQuotes,
                    type: '@trading-exchange/thunk/handleRequest/rejected',
                }),
            );

            await renderUseExchangeQuotesWithFilledForm(store);

            expect(analyticsReportSpy).not.toHaveBeenCalled();
        });
    });
});
