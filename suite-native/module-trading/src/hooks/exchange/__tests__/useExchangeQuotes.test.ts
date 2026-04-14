import { type CryptoId } from 'invity-api';

import {
    INVITY_API_RELOAD_QUOTES_AFTER_SECONDS,
    type MinimalExchangeFormProps,
    tradingActions,
    tradingExchangeActions,
} from '@suite-common/trading';
import { type AccountKey } from '@suite-common/wallet-types';
import { events } from '@suite-native/analytics';
import {
    type PreloadedState,
    type TestStore,
    act,
    initStore,
    renderHookWithStoreProvider,
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
import { type ExchangeFormValues } from '@suite-native/trading-types';
import { PROTO } from '@trezor/connect';

import { useExchangeForm } from '../useExchangeForm';
import { useExchangeQuotes } from '../useExchangeQuotes';

const mockReport = jest.fn();

jest.mock('@suite-native/services', () => {
    const original = jest.requireActual('@suite-native/services');

    return {
        ...original,
        useAnalytics: () => ({
            report: mockReport,
        }),
    };
});

jest.mock('@trezor/react-utils', () => {
    const originalModule = jest.requireActual('@trezor/react-utils');

    return {
        ...originalModule,
        useDebounce: () => (fn: () => unknown) => fn(),
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
        renderHookWithStoreProvider(
            () => {
                const form = useExchangeForm();
                useExchangeQuotes(form);

                return { form };
            },
            { store },
        );

    beforeEach(() => {
        mockReport.mockClear();
    });

    it('should query quotes once all required data is selected', async () => {
        const store = getInitializedStore();
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const { result } = renderUseExchangeQuotes(store);
        const { form } = result.current;

        await act(async () => {
            form.setValue('sendAsset', btcAsset);
            form.setValue('receiveAsset', ethAsset);
            form.setValue('sendCryptoAmount', '0.1');
            await Promise.resolve();
        });

        expect(dispatchSpy).toHaveBeenCalledWith({
            type: 'handleRequestThunkMock',
            payload: {
                formValues: {
                    outputs: [{ amount: '0.1' }],
                    receiveCryptoSelect: { id: 'ethereum' as CryptoId },
                    sendCryptoSelect: { id: 'bitcoin' as CryptoId },
                } satisfies MinimalExchangeFormProps,
                network: expect.objectContaining({
                    tradeCryptoId: 'bitcoin',
                }),
                composeRequestCallback: expect.anything(),
                shouldSendInSats: false,
            },
        });
    });

    it('should respect sats setting', async () => {
        const store = getInitializedStore(PROTO.AmountUnit.SATOSHI);
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const { result } = renderUseExchangeQuotes(store);
        const { form } = result.current;

        await act(async () => {
            form.setValue('sendAsset', btcAsset);
            form.setValue('receiveAsset', ethAsset);
            form.setValue('sendCryptoAmount', '0.1');
            await Promise.resolve();
        });

        expect(dispatchSpy).toHaveBeenCalledWith({
            type: 'handleRequestThunkMock',
            payload: expect.objectContaining({ shouldSendInSats: true }),
        });
    });

    it.each<string>(['0', '-1'])(
        'should not query quotes when amount is zero or less',
        async amount => {
            const store = getInitializedStore();
            const dispatchSpy = jest.spyOn(store, 'dispatch');
            const { result } = renderUseExchangeQuotes(store);
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
        const store = getInitializedStore();
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const { result } = renderUseExchangeQuotes(store);
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
        const store = getInitializedStore();
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const { result } = renderUseExchangeQuotes(store);
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
    });

    it('should clear exchange state on unmount', () => {
        const store = getInitializedStore();
        store.dispatch(tradingExchangeActions.saveQuotes(exchangeQuotes));
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const { unmount } = renderUseExchangeQuotes(store);

        unmount();

        expect(dispatchSpy).toHaveBeenCalledWith({
            payload: undefined,
            type: 'tradingExchange/clearState',
        });
    });

    it.each<[keyof ExchangeFormValues, ExchangeFormValues[keyof ExchangeFormValues]]>([
        ['receiveAsset', usdtAsset],
        ['sendCryptoAmount', '0.2'],
        [
            'sendAccount',
            getBtcAccount(
                'btc-account-2' as AccountKey, // Todo: create properly via `createAccountKey()`
            ),
        ],
    ])('should refetch quotes on %s value change', async (field, value) => {
        const store = getInitializedStore();
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const { result } = renderUseExchangeQuotes(store);
        const { form } = result.current;

        await act(async () => {
            form.setValue('sendAsset', btcAsset);
            form.setValue('receiveAsset', ethAsset);
            form.setValue('sendCryptoAmount', '1');
            await Promise.resolve();
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
    });

    it('should re-fetch quotes when re-fetch time elapsed', async () => {
        const store = getInitializedStore();
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const { result } = renderUseExchangeQuotes(store);
        const { form } = result.current;

        await act(async () => {
            form.setValue('sendAsset', btcAsset);
            form.setValue('receiveAsset', ethAsset);
            form.setValue('sendCryptoAmount', '1');
            await Promise.resolve();
        });

        act(() => {
            store.dispatch(
                tradingActions.setRefetchQuotesTimestamp(
                    Date.now() - INVITY_API_RELOAD_QUOTES_AFTER_SECONDS * 1000,
                ),
            );
        });
        dispatchSpy.mockClear();

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(dispatchSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'handleRequestThunkMock',
            }),
        );
    });

    it('should not re-fetch quotes when re-fetch time elapsed but not all required data are available', async () => {
        const store = getInitializedStore();
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const { result } = renderUseExchangeQuotes(store);
        const { form } = result.current;

        act(() => {
            form.setValue('sendAsset', btcAsset);
        });

        act(() => {
            store.dispatch(
                tradingActions.setRefetchQuotesTimestamp(
                    Date.now() - INVITY_API_RELOAD_QUOTES_AFTER_SECONDS * 1000,
                ),
            );
        });
        dispatchSpy.mockClear();

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(dispatchSpy).not.toHaveBeenCalledWith(
            expect.objectContaining({ type: 'handleRequestThunkMock' }),
        );
    });

    it('should clear quotes when data in form becomes invalid', async () => {
        const store = getInitializedStore();
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const { result } = renderUseExchangeQuotes(store);
        const { form } = result.current;

        await act(async () => {
            form.setValue('sendAsset', btcAsset);
            form.setValue('receiveAsset', ethAsset);
            form.setValue('sendCryptoAmount', '1');
            await Promise.resolve();
        });
        // handleRequestThunk is mocked, add quotes manually
        act(() => {
            store.dispatch(tradingExchangeActions.saveQuotes(exchangeQuotes));
        });

        dispatchSpy.mockClear();
        // clear some value to make form invalid
        await act(async () => {
            form.setValue('sendCryptoAmount', undefined);
            await Promise.resolve();
        });

        // The 2nd call ("trading/setCurrentProviderMetadata") is out of scope of this test,
        // we care only about the "tradingBuy/clearQuotesAndQuotesRequest" call.
        expect(dispatchSpy).toHaveBeenCalledTimes(2);
        expect(dispatchSpy).toHaveBeenNthCalledWith(1, {
            payload: undefined,
            type: 'tradingExchange/clearQuotesAndQuotesRequest',
        });
        expect(store.getState().wallet.trading.exchange.quotes).toEqual([]);
    });

    describe('analytics', () => {
        const renderUseExchangeQuotesWithFilledForm = async (store: TestStore) => {
            const { result } = renderUseExchangeQuotes(store);
            const { form } = result.current;

            mockReport.mockClear();

            await act(async () => {
                form.setValue('sendAsset', btcAsset);
                form.setValue('receiveAsset', ethAsset);
                form.setValue('sendCryptoAmount', '1');
                await Promise.resolve(); // flush effects → fetchQuotes called
                await Promise.resolve(); // flush fetchQuotes first await
                await Promise.resolve(); // flush waitForPromiseAndReport → analytics fires
            });
        };

        it('should report when quotes are fetched', async () => {
            const store = getInitializedStore();
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

            expect(mockReport).toHaveBeenCalledWith({
                type: events.tradingQuoteReceivedEvent.name,
                payload: {
                    type: 'exchange',
                },
            });
        });

        it('should not report when empty quotes are returned', async () => {
            const store = getInitializedStore();
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

            expect(mockReport).not.toHaveBeenCalledWith(
                expect.objectContaining({ type: events.tradingQuoteReceivedEvent.name }),
            );
        });

        it('should not report when handleRequestThunk rejected', async () => {
            const store = getInitializedStore();
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

            expect(mockReport).not.toHaveBeenCalledWith(
                expect.objectContaining({ type: events.tradingQuoteReceivedEvent.name }),
            );
        });
    });
});
