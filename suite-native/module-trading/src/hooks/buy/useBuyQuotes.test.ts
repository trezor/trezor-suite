import {
    TRADE_API_RELOAD_QUOTES_AFTER_SECONDS,
    tradingActions,
    tradingBuyActions,
} from '@suite-common/trading';
import { type TestStore, act, renderHookWithStoreProvider } from '@suite-native/test-utils-store';
import {
    bnbAsset,
    btc1NormalAccount,
    buyQuotes,
    eth1NormalAccount,
    getInitializedTradingState,
    usdcAsset,
} from '@suite-native/trading-fixtures';
import { type BuyFormValues } from '@suite-native/trading-types';

import { useBuyForm } from './useBuyForm';
import { useBuyQuotes } from './useBuyQuotes';
import { createTradingLightStore } from '../../test-utils/tradingTestUtils';

jest.mock('@trezor/react-utils', () => {
    const originalModule = jest.requireActual('@trezor/react-utils');

    return {
        ...originalModule,
        useDebounce: () => (fn: () => unknown) => fn(),
    };
});

jest.mock('@suite-common/trading', () => ({
    ...jest.requireActual('@suite-common/trading'),
    buyThunks: {
        handleRequestThunk: (payload: unknown) => ({
            type: 'handleRequestThunkMock',
            payload,
        }),
    },
}));

describe('useBuyQuotes', () => {
    const getInitializedStore = () => {
        const tradingState = getInitializedTradingState();
        tradingState.buy.tradingAccountKey = eth1NormalAccount.key;

        return createTradingLightStore({
            overrides: {
                wallet: { trading: tradingState, accounts: [eth1NormalAccount] },
            },
        });
    };

    const renderUseBuyQuotes = async (store: TestStore) =>
        await renderHookWithStoreProvider(
            () => {
                const form = useBuyForm();
                useBuyQuotes(form);

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
        const { result } = await renderUseBuyQuotes(store);

        await act(() => {
            result.current.setValue('asset', usdcAsset);
            result.current.setValue('fiatCurrency', 'usd');
        });
        await act(() => {
            result.current.setValue('fiatValue', '100');
        });

        expect(dispatchSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'handleRequestThunkMock',
            }),
        );
    });

    it('should query quotes once all required data is selected for BNB', async () => {
        const store = getInitializedStore();
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const { result } = await renderUseBuyQuotes(store);

        await act(() => {
            result.current.setValue('asset', bnbAsset);
            result.current.setValue('fiatCurrency', 'usd');
        });
        await act(() => {
            result.current.setValue('fiatValue', '100');
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
            const { result } = await renderUseBuyQuotes(store);

            await act(() => {
                result.current.setValue('asset', bnbAsset);
                result.current.setValue('fiatCurrency', 'usd');
            });
            await act(() => {
                result.current.setValue('fiatValue', amount);
            });

            expect(dispatchSpy).not.toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'handleRequestThunkMock',
                }),
            );
        },
    );

    it('should accept amount in crypto when requested', async () => {
        const store = getInitializedStore();
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const { result } = await renderUseBuyQuotes(store);

        await act(() => {
            result.current.setValue('asset', usdcAsset);
            result.current.setValue('fiatCurrency', 'usd');
            result.current.setValue('amountInCrypto', true);
        });
        await act(() => {
            result.current.setValue('cryptoValue', '0.1');
        });

        expect(dispatchSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'handleRequestThunkMock',
            }),
        );
    });

    it('should clear buy state on unmount', async () => {
        const store = getInitializedStore();
        store.dispatch(tradingBuyActions.saveQuotes(buyQuotes));
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const { unmount } = await renderUseBuyQuotes(store);

        await unmount();

        expect(dispatchSpy).toHaveBeenCalledWith({
            payload: undefined,
            type: 'tradingBuy/clearState',
        });
    });

    it.each([
        ['fiatValue', '1000'],
        ['country', 'CZ'],
        [
            'receiveAccount',
            {
                account: btc1NormalAccount,
                address: btc1NormalAccount.addresses!.unused[0],
            },
        ],
    ] as [keyof BuyFormValues, BuyFormValues[keyof BuyFormValues]][])(
        'should re-fetch quotes on %s value change',
        async (field, value) => {
            const store = getInitializedStore();
            const dispatchSpy = jest.spyOn(store, 'dispatch');
            const { result } = await renderUseBuyQuotes(store);
            await act(() => {
                result.current.setValue('asset', usdcAsset);
                result.current.setValue('fiatCurrency', 'usd');
            });
            await act(() => {
                result.current.setValue('fiatValue', '100');
            });

            dispatchSpy.mockClear();
            await act(() => {
                result.current.setValue(field, value);
            });

            expect(dispatchSpy).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    type: 'handleRequestThunkMock',
                }),
            );
        },
    );

    it('should not re-fetch quotes when no address is selected on btc account', async () => {
        const store = getInitializedStore();
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const { result } = await renderUseBuyQuotes(store);
        await act(() => {
            result.current.setValue('asset', usdcAsset);
            result.current.setValue('fiatCurrency', 'usd');
        });
        await act(() => {
            result.current.setValue('fiatValue', '100');
        });

        await act(() => {
            result.current.setValue('receiveAccount', undefined);
        });
        dispatchSpy.mockClear();
        await act(() => {
            result.current.setValue('receiveAccount', {
                account: btc1NormalAccount,
            });
        });

        expect(dispatchSpy).not.toHaveBeenLastCalledWith(
            expect.objectContaining({
                type: 'handleRequestThunkMock',
            }),
        );
    });

    it('should re-fetch quotes when re-fetch time elapsed', async () => {
        jest.useFakeTimers();
        const store = getInitializedStore();
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const { result } = await renderUseBuyQuotes(store);
        dispatchSpy.mockClear();

        await act(() => {
            result.current.setValue('asset', usdcAsset);
            result.current.setValue('fiatCurrency', 'usd');
        });

        await act(() => {
            result.current.setValue('fiatValue', '100');
        });

        expect(dispatchSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'handleRequestThunkMock',
            }),
        );

        await act(() => {
            store.dispatch(tradingActions.setRefetchQuotesTimestamp(Date.now()));
        });
        dispatchSpy.mockClear();

        await act(() => {
            jest.advanceTimersByTime(TRADE_API_RELOAD_QUOTES_AFTER_SECONDS * 1000);
        });

        expect(dispatchSpy).toHaveBeenCalledTimes(1);
        expect(dispatchSpy).toHaveBeenLastCalledWith(
            expect.objectContaining({
                type: 'handleRequestThunkMock',
            }),
        );
    });

    it('should not re-fetch quotes when re-fetch time elapsed but not all required data are available', async () => {
        jest.useFakeTimers();
        const store = getInitializedStore();
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const { result } = await renderUseBuyQuotes(store);

        await act(() => {
            result.current.setValue('fiatCurrency', 'usd');
        });

        await act(() => {
            store.dispatch(tradingActions.setRefetchQuotesTimestamp(Date.now()));
        });
        dispatchSpy.mockClear();

        await act(() => {
            jest.advanceTimersByTime(TRADE_API_RELOAD_QUOTES_AFTER_SECONDS * 1000);
        });

        expect(dispatchSpy).not.toHaveBeenCalledWith(
            expect.objectContaining({ type: 'handleRequestThunkMock' }),
        );
    });

    it('should clear quotes when data in form becomes invalid', async () => {
        const store = getInitializedStore();
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const { result } = await renderUseBuyQuotes(store);

        await act(() => {
            result.current.setValue('asset', usdcAsset);
            result.current.setValue('fiatCurrency', 'usd');
            result.current.setValue('fiatValue', '100');
        });
        // handleRequestThunk is mocked, add quotes manually
        await act(() => {
            store.dispatch(tradingBuyActions.saveQuotes(buyQuotes));
        });

        dispatchSpy.mockClear();
        // clear some value to make form invalid
        await act(() => {
            result.current.setValue('fiatValue', undefined);
        });

        // The 2nd call ("trading/setCurrentProviderMetadata") is out of scope of this test,
        // we care only about the "tradingBuy/clearQuotesAndQuotesRequest" call.
        expect(dispatchSpy).toHaveBeenCalledTimes(2);
        expect(dispatchSpy).toHaveBeenNthCalledWith(1, {
            payload: undefined,
            type: 'tradingBuy/clearQuotesAndQuotesRequest',
        });
        expect(store.getState().wallet.trading.buy.quotes).toEqual([]);
    });

    it('should not request quotes when coinInfo is missing for the selected asset', async () => {
        const store = getInitializedStore();
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const { result } = await renderUseBuyQuotes(store);

        await act(() => {
            result.current.setValue('asset', usdcAsset);
            result.current.setValue('fiatCurrency', 'usd');
            result.current.setValue('fiatValue', '100');
        });

        expect(dispatchSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'handleRequestThunkMock',
            }),
        );

        dispatchSpy.mockClear();

        await act(() => {
            store.dispatch(
                tradingActions.saveInfo({
                    coins: {},
                    platforms: {},
                    config: {},
                }),
            );
        });

        // Trigger a re-fetch via amount change while coinInfo is gone
        await act(() => {
            result.current.setValue('fiatValue', '200');
        });

        expect(dispatchSpy).not.toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'handleRequestThunkMock',
            }),
        );
    });
});
