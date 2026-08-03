import {
    TRADE_API_RELOAD_QUOTES_AFTER_SECONDS,
    tradingActions,
    tradingSellActions,
} from '@suite-common/trading';
import { asAccountDescriptor } from '@suite-common/wallet-types';
import { type TestStore, act, renderHookWithStoreProvider } from '@suite-native/test-utils-store';
import {
    banxaCreditCardSellQuote,
    bnbAsset,
    getBtcAccount,
    getEthAccount,
    sellQuotes,
    usdcAsset,
} from '@suite-native/trading-fixtures';
import { type SellFormValues } from '@suite-native/trading-types';

import { useSellForm } from './useSellForm';
import { useSellQuotes } from './useSellQuotes';
import { createTradingLightStore } from '../../test-utils/tradingTestUtils';

const mockDebounce = (fn: () => unknown) => fn();

const btc1Account = getBtcAccount({ descriptor: asAccountDescriptor('btc1normal') });
const eth1Account = getEthAccount({ descriptor: asAccountDescriptor('eth1normal') });

jest.mock('@trezor/react-utils', () => {
    const originalModule = jest.requireActual('@trezor/react-utils');

    return {
        ...originalModule,
        useDebounce: () => mockDebounce,
    };
});

jest.mock('@suite-common/trading', () => ({
    ...jest.requireActual('@suite-common/trading'),
    sellThunks: {
        handleRequestThunk: (payload: unknown) => ({
            type: 'handleRequestThunkMock',
            payload,
        }),
    },
}));

describe('useSellQuotes', () => {
    const getInitializedStore = () =>
        createTradingLightStore({
            tradeType: 'sell',
            overrides: {
                wallet: {
                    trading: { sell: { tradingAccountKey: btc1Account.key } },
                },
            },
        });

    const renderUseSellQuotes = (store: TestStore) =>
        renderHookWithStoreProvider(
            () => {
                const form = useSellForm();
                useSellQuotes(form);

                return form;
            },
            { store },
        );

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should query quotes once all required data is selected', async () => {
        const store = getInitializedStore();
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const { result } = renderUseSellQuotes(store);

        act(() => {
            result.current.setValue('sendAsset', usdcAsset);
            result.current.setValue('fiatCurrency', 'usd');
            result.current.setValue('amountInCrypto', true);
        });
        await act(async () => {
            result.current.setValue('cryptoStringAmount', '1');
            // allow validations to run
            await Promise.resolve();
        });

        expect(dispatchSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'handleRequestThunkMock',
            }),
        );
    });

    it.each<string>(['0', '-1'])(
        'should not query quotes when amount is zero or less',
        async amount => {
            const store = getInitializedStore();
            const dispatchSpy = jest.spyOn(store, 'dispatch');
            const { result } = renderUseSellQuotes(store);

            act(() => {
                result.current.setValue('sendAsset', bnbAsset);
                result.current.setValue('fiatCurrency', 'usd');
            });
            await act(async () => {
                result.current.setValue('cryptoStringAmount', amount);
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

    it('should accept amount in fiat when requested', async () => {
        const store = getInitializedStore();
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const { result } = renderUseSellQuotes(store);

        act(() => {
            result.current.setValue('sendAsset', usdcAsset);
            result.current.setValue('fiatCurrency', 'usd');
            result.current.setValue('amountInCrypto', false);
        });
        await act(async () => {
            result.current.setValue('fiatStringAmount', '100');
            // allow validations to run
            await Promise.resolve();
        });

        expect(dispatchSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'handleRequestThunkMock',
            }),
        );
    });

    it('should clear sell state on unmount', () => {
        const store = getInitializedStore();
        store.dispatch(tradingSellActions.saveQuotes(sellQuotes));
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const { unmount } = renderUseSellQuotes(store);

        unmount();

        expect(dispatchSpy).toHaveBeenCalledWith({
            payload: undefined,
            type: 'tradingSell/clearState',
        });
    });

    it.each([
        ['fiatStringAmount', '1000'],
        ['country', 'CZ'],
        ['sendAccount', getBtcAccount({ descriptor: asAccountDescriptor('btcAccount2') })],
    ] as [keyof SellFormValues, SellFormValues[keyof SellFormValues]][])(
        'should re-fetch quotes on %s value change',
        async (field, value) => {
            const store = getInitializedStore();
            const dispatchSpy = jest.spyOn(store, 'dispatch');
            const { result } = renderUseSellQuotes(store);
            act(() => {
                result.current.setValue('sendAsset', usdcAsset);
                result.current.setValue('fiatCurrency', 'usd');
            });
            await act(async () => {
                result.current.setValue('fiatStringAmount', '100');
                // allow validations to run
                await Promise.resolve();
            });

            dispatchSpy.mockClear();
            act(() => {
                result.current.setValue(field, value);
            });

            expect(dispatchSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'handleRequestThunkMock',
                }),
            );
        },
    );

    it('should re-fetch quotes when re-fetch time elapsed', async () => {
        jest.useFakeTimers();
        const store = getInitializedStore();
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const { result } = renderUseSellQuotes(store);
        act(() => {
            result.current.setValue('sendAsset', usdcAsset);
            result.current.setValue('fiatCurrency', 'usd');
        });

        await act(async () => {
            result.current.setValue('fiatStringAmount', '100');
            // allow validations to run
            await Promise.resolve();
        });

        act(() => {
            store.dispatch(tradingActions.setRefetchQuotesTimestamp(Date.now()));
        });
        dispatchSpy.mockClear();

        act(() => {
            jest.advanceTimersByTime(TRADE_API_RELOAD_QUOTES_AFTER_SECONDS * 1000);
        });

        expect(dispatchSpy).toHaveBeenCalledTimes(1);
        expect(dispatchSpy).toHaveBeenLastCalledWith(
            expect.objectContaining({
                type: 'handleRequestThunkMock',
            }),
        );
    });

    it('should not re-fetch quotes when re-fetch time elapsed but not all required data are available', () => {
        jest.useFakeTimers();
        const store = getInitializedStore();
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const { result, unmount } = renderUseSellQuotes(store);

        act(() => {
            result.current.setValue('fiatCurrency', 'usd');
        });

        act(() => {
            store.dispatch(tradingActions.setRefetchQuotesTimestamp(Date.now()));
        });
        dispatchSpy.mockClear();

        act(() => {
            jest.advanceTimersByTime(TRADE_API_RELOAD_QUOTES_AFTER_SECONDS * 1000);
        });

        expect(dispatchSpy).not.toHaveBeenCalledWith(
            expect.objectContaining({ type: 'handleRequestThunkMock' }),
        );

        unmount();
    });

    it('should clear quotes when data in form becomes invalid', async () => {
        const store = getInitializedStore();
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const { result, unmount } = renderUseSellQuotes(store);

        act(() => {
            result.current.setValue('sendAsset', usdcAsset);
            result.current.setValue('fiatCurrency', 'usd');
            result.current.setValue('fiatStringAmount', '100');
        });
        // handleRequestThunk is mocked, add quotes manually
        await act(async () => {
            store.dispatch(tradingSellActions.saveQuotes(sellQuotes));
            // allow validations to run
            await Promise.resolve();
        });

        dispatchSpy.mockClear();
        // clear some value to make form invalid
        act(() => {
            result.current.setValue('fiatStringAmount', undefined);
        });

        expect(dispatchSpy).toHaveBeenNthCalledWith(1, {
            payload: undefined,
            type: 'tradingSell/clearQuotesAndQuotesRequest',
        });
        expect(store.getState().wallet.trading.sell.quotes).toEqual([]);

        // unmount hook to avoid unintentional rerenders
        unmount();
    });

    it('should not clear quotes when error is from quote', async () => {
        const sellQuoteWithTooHighCryptoAmount = {
            ...banxaCreditCardSellQuote,
            cryptoStringAmount: '2',
        };
        const store = getInitializedStore();
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const { result } = renderUseSellQuotes(store);

        act(() => {
            store.dispatch(tradingSellActions.setTradingAccountKey(eth1Account.key));
            result.current.setValue('sendAsset', usdcAsset);
            result.current.setValue('fiatCurrency', 'usd');
            result.current.setValue('amountInCrypto', false);
            result.current.setValue('fiatStringAmount', '100');
        });
        // handleRequestThunk is mocked, add quotes manually
        await act(async () => {
            store.dispatch(tradingSellActions.saveQuotes([sellQuoteWithTooHighCryptoAmount]));
            // allow validations to run
            await Promise.resolve();
        });

        dispatchSpy.mockClear();
        expect(store.getState().wallet.trading.sell.quotes).toEqual([
            sellQuoteWithTooHighCryptoAmount,
        ]);
        expect(result.current.getValues('quote')).toEqual(sellQuoteWithTooHighCryptoAmount);

        // make sure form has an error
        const { invalid } = result.current.getFieldState('cryptoStringAmount');
        expect(invalid).toBe(true);
    });

    it('should not clear quotes when fiat quote exceeds max spendable amount', async () => {
        const store = getInitializedStore();
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const { result } = renderUseSellQuotes(store);

        act(() => {
            result.current.setValue('sendAsset', usdcAsset);
            result.current.setValue('fiatCurrency', 'usd');
            result.current.setValue('amountInCrypto', false);
            result.current.setValue('fiatStringAmount', '100');
        });
        await act(async () => {
            store.dispatch(tradingSellActions.saveQuotes(sellQuotes));
            // allow validations to run
            await Promise.resolve();
        });

        dispatchSpy.mockClear();
        await act(async () => {
            result.current.setError('cryptoStringAmount', {
                type: 'network-reserve',
                message: 'Not enough balance to cover fees',
            });
            // allow validations to run
            await Promise.resolve();
        });

        expect(dispatchSpy).not.toHaveBeenCalledWith({
            payload: undefined,
            type: 'tradingSell/clearQuotesAndQuotesRequest',
        });
        expect(store.getState().wallet.trading.sell.quotes).toEqual(sellQuotes);
    });

    it('should not query quotes when form contains error', async () => {
        const store = getInitializedStore();
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const { result } = renderUseSellQuotes(store);

        await act(async () => {
            result.current.setValue('sendAsset', usdcAsset);
            result.current.setValue('fiatCurrency', 'usd');
            result.current.setValue('amountInCrypto', true);
            result.current.setValue('cryptoStringAmount', '1');
            // allow validations to run
            await Promise.resolve();
        });

        dispatchSpy.mockClear();
        await act(async () => {
            result.current.setError('cryptoStringAmount', {
                type: 'manual',
                message: 'Some error',
            });
            // allow validations to run
            await Promise.resolve();
        });

        expect(dispatchSpy).not.toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'handleRequestThunkMock',
            }),
        );
    });
});
