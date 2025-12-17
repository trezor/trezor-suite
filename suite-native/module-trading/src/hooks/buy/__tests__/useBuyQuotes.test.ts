import { INVITY_API_RELOAD_QUOTES_AFTER_SECONDS, tradingBuyActions } from '@suite-common/trading';
import { Account } from '@suite-common/wallet-types';
import {
    PreloadedState,
    TestStore,
    act,
    initStore,
    renderHookWithStoreProviderAsync,
} from '@suite-native/test-utils';
import {
    bnbAsset,
    buyQuotes,
    getBtcAccount,
    getInitializedTradingState,
    usdcAsset,
} from '@suite-native/trading-fixtures';
import { BuyFormValues } from '@suite-native/trading-types';

import { useBuyForm } from '../useBuyForm';
import { useBuyQuotes } from '../useBuyQuotes';

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
    buyThunks: {
        handleRequestThunk: (payload: unknown) => ({
            type: 'handleRequestThunkMock',
            payload,
        }),
    },
}));

describe('useBuyQuotes', () => {
    const getInitializedStore = () => {
        const preloadedState: PreloadedState = {
            wallet: { trading: getInitializedTradingState(), accounts: [getBtcAccount()] },
        };
        preloadedState.wallet!.trading!.buy!.tradingAccountKey = 'btc-account-1';

        return initStore(preloadedState).store;
    };

    const renderUseBuyQuotes = (store: TestStore) =>
        renderHookWithStoreProviderAsync(
            () => {
                const form = useBuyForm();
                useBuyQuotes(form);

                return form;
            },
            { store },
        );

    beforeEach(() => {
        mockTimeSpent = 0;
    });

    it('should query quotes once all required data is selected', async () => {
        const store = await getInitializedStore();
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const { result } = await renderUseBuyQuotes(store);

        act(() => {
            result.current.setValue('asset', usdcAsset);
            result.current.setValue('fiatCurrency', 'usd');
        });
        act(() => {
            result.current.setValue('fiatValue', '100');
        });

        expect(dispatchSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'handleRequestThunkMock',
            }),
        );
    });

    it('should query quotes once all required data is selected for BNB', async () => {
        const store = await getInitializedStore();
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const { result } = await renderUseBuyQuotes(store);

        act(() => {
            result.current.setValue('asset', bnbAsset);
            result.current.setValue('fiatCurrency', 'usd');
        });
        act(() => {
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
            const store = await getInitializedStore();
            const dispatchSpy = jest.spyOn(store, 'dispatch');
            const { result } = await renderUseBuyQuotes(store);

            act(() => {
                result.current.setValue('asset', bnbAsset);
                result.current.setValue('fiatCurrency', 'usd');
            });
            act(() => {
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
        const store = await getInitializedStore();
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const { result } = await renderUseBuyQuotes(store);

        act(() => {
            result.current.setValue('asset', usdcAsset);
            result.current.setValue('fiatCurrency', 'usd');
            result.current.setValue('amountInCrypto', true);
        });
        act(() => {
            result.current.setValue('cryptoValue', '0.1');
        });

        expect(dispatchSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'handleRequestThunkMock',
            }),
        );
    });

    it('should clear buy state on unmount', async () => {
        const store = await getInitializedStore();
        store.dispatch(tradingBuyActions.saveQuotes(buyQuotes));
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const { unmount } = await renderUseBuyQuotes(store);

        unmount();

        expect(dispatchSpy).toHaveBeenCalledWith({
            payload: undefined,
            type: 'tradingBuy/clearState',
        });
    });

    it.each([
        ['fiatValue', '1000'],
        ['country', 'CZ'],
        ['receiveAccount', { account: { key: 'btc1', descriptor: 'descriptor_btc1' } as Account }],
    ] as [keyof BuyFormValues, BuyFormValues[keyof BuyFormValues]][])(
        'should re-fetch quotes on %s value change',
        async (field, value) => {
            const store = await getInitializedStore();
            const dispatchSpy = jest.spyOn(store, 'dispatch');
            const { result } = await renderUseBuyQuotes(store);
            act(() => {
                result.current.setValue('asset', usdcAsset);
                result.current.setValue('fiatCurrency', 'usd');
            });
            act(() => {
                result.current.setValue('fiatValue', '100');
            });

            dispatchSpy.mockClear();
            act(() => {
                result.current.setValue(field, value);
            });

            expect(dispatchSpy).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    type: 'handleRequestThunkMock',
                }),
            );
        },
    );

    it('should re-fetch quotes when re-fetch time elapsed', async () => {
        const store = await getInitializedStore();
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const { result, rerender } = await renderUseBuyQuotes(store);
        dispatchSpy.mockClear();

        act(() => {
            result.current.setValue('asset', usdcAsset);
            result.current.setValue('fiatCurrency', 'usd');
        });

        act(() => {
            result.current.setValue('fiatValue', '100');
        });

        expect(dispatchSpy).toHaveBeenCalledTimes(3);

        dispatchSpy.mockClear();
        mockTimeSpent = INVITY_API_RELOAD_QUOTES_AFTER_SECONDS;
        rerender({});

        expect(dispatchSpy).toHaveBeenCalledTimes(1);
        expect(dispatchSpy).toHaveBeenLastCalledWith(
            expect.objectContaining({
                type: 'handleRequestThunkMock',
            }),
        );
    });

    it('should not re-fetch quotes when re-fetch time elapsed but not all required data are available', async () => {
        const store = await getInitializedStore();
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const { result, rerender } = await renderUseBuyQuotes(store);

        dispatchSpy.mockClear();
        act(() => {
            result.current.setValue('fiatCurrency', 'usd');
        });

        mockTimeSpent = INVITY_API_RELOAD_QUOTES_AFTER_SECONDS;
        rerender({});

        // 1st call - trading/buyAssetChanged
        expect(dispatchSpy).toHaveBeenCalledTimes(1);
    });

    it('should clear quotes when data in form becomes invalid', async () => {
        const store = await getInitializedStore();
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const { result } = await renderUseBuyQuotes(store);

        act(() => {
            result.current.setValue('asset', usdcAsset);
            result.current.setValue('fiatCurrency', 'usd');
            result.current.setValue('fiatValue', '100');
        });
        // handleRequestThunk is mocked, add quotes manually
        act(() => {
            store.dispatch(tradingBuyActions.saveQuotes(buyQuotes));
        });

        dispatchSpy.mockClear();
        // clear some value to make form invalid
        act(() => {
            result.current.setValue('fiatValue', undefined);
        });

        expect(dispatchSpy).toHaveBeenCalledTimes(1);
        expect(dispatchSpy).toHaveBeenLastCalledWith({
            payload: undefined,
            type: 'tradingBuy/clearQuotesAndQuotesRequest',
        });
        expect(store.getState().wallet.trading.buy.quotes).toEqual([]);
    });
});
