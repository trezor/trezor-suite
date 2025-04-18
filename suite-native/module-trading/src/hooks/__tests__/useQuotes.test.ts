import type { BuyTrade } from 'invity-api';

import { INVITY_API_RELOAD_QUOTES_AFTER_SECONDS, tradingBuyActions } from '@suite-common/trading';
import { Account } from '@suite-common/wallet-types';
import {
    PreloadedState,
    TestStore,
    act,
    initStore,
    renderHookWithStoreProviderAsync,
} from '@suite-native/test-utils';

import quotes from '../../__fixtures__/quotes.json';
import { usdcAsset } from '../../__fixtures__/tradeableAssets';
import { getInitializedTradingState } from '../../__fixtures__/tradingState';
import { TradingBuyFormValues } from '../../types';
import { useQuotes } from '../useQuotes';
import { useTradingBuyForm } from '../useTradingBuyForm';

let mockTimeSpent: number;

jest.mock('@trezor/react-utils', () => {
    const originalModule = jest.requireActual('@trezor/react-utils');

    return {
        ...originalModule,
        useDebounce: () => (fn: () => unknown) => fn(),
        useTimer: () => ({
            ...originalModule.useTimer(),
            timeSpent: { seconds: mockTimeSpent },
        }),
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

describe('useQuotes', () => {
    const getInitializedStore = async () => {
        const preloadedState: PreloadedState = {
            wallet: { tradingNew: getInitializedTradingState() },
        };
        preloadedState.wallet!.tradingNew!.buy!.selectedReceiveAccount = {
            account: { key: 'btc1' } as Account,
        };

        return await initStore(preloadedState);
    };

    const renderUseQuotes = (store: TestStore) =>
        renderHookWithStoreProviderAsync(
            () => {
                const form = useTradingBuyForm();
                useQuotes(form);

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
        const { result } = await renderUseQuotes(store);

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

    it('should accept amount in crypto when requested', async () => {
        const store = await getInitializedStore();
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const { result } = await renderUseQuotes(store);

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
        store.dispatch(tradingBuyActions.saveQuotes(quotes as BuyTrade[]));
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const { unmount } = await renderUseQuotes(store);

        unmount();

        expect(dispatchSpy).toHaveBeenCalledWith({
            payload: undefined,
            type: 'trading/clearBuyState',
        });
    });

    it.each([
        ['fiatValue', '1000'],
        ['country', 'CZ'],
    ] as [keyof TradingBuyFormValues, TradingBuyFormValues[keyof TradingBuyFormValues]][])(
        'should re-fetch quotes on %s value change',
        async (field, value) => {
            const store = await getInitializedStore();
            const dispatchSpy = jest.spyOn(store, 'dispatch');
            const { result } = await renderUseQuotes(store);
            act(() => {
                result.current.setValue('asset', usdcAsset);
                result.current.setValue('fiatCurrency', 'usd');
            });
            act(() => {
                result.current.setValue('fiatValue', '100');
            });

            act(() => {
                result.current.setValue(field, value);
            });

            // 1st call - trading/setBuySelectedReceiveAccount
            // 2nd call - initial handleRequestThunkMock
            // 3rd call - re-fetch of handleRequestThunkMock
            expect(dispatchSpy).toHaveBeenCalledTimes(3);
            expect(dispatchSpy).toHaveBeenNthCalledWith(
                3,
                expect.objectContaining({
                    type: 'handleRequestThunkMock',
                }),
            );
        },
    );

    it('should re-fetch quotes when re-fetch time elapsed', async () => {
        const store = await getInitializedStore();
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const { result, rerender } = await renderUseQuotes(store);
        act(() => {
            result.current.setValue('asset', usdcAsset);
            result.current.setValue('fiatCurrency', 'usd');
        });
        act(() => {
            result.current.setValue('fiatValue', '100');
        });

        expect(dispatchSpy).toHaveBeenCalledTimes(2);

        mockTimeSpent = INVITY_API_RELOAD_QUOTES_AFTER_SECONDS;
        rerender({});

        // 1st call - trading/setBuySelectedReceiveAccount
        // 2nd call - initial handleRequestThunkMock
        // 3rd call - re-fetch of handleRequestThunkMock
        expect(dispatchSpy).toHaveBeenCalledTimes(3);
        expect(dispatchSpy).toHaveBeenNthCalledWith(
            3,
            expect.objectContaining({
                type: 'handleRequestThunkMock',
            }),
        );
    });

    it('should not re-fetch quotes when re-fetch time elapsed but not all required data are available', async () => {
        const store = await getInitializedStore();
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const { result, rerender } = await renderUseQuotes(store);
        act(() => {
            result.current.setValue('fiatCurrency', 'usd');
        });

        mockTimeSpent = INVITY_API_RELOAD_QUOTES_AFTER_SECONDS;
        rerender({});

        expect(dispatchSpy).toHaveBeenCalledTimes(0);
    });

    // TODO this test logs error
    it.skip('should clear quotes when data in form becomes invalid', async () => {
        const store = await getInitializedStore();
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const { result } = await renderUseQuotes(store);

        act(() => {
            result.current.setValue('asset', usdcAsset);
            result.current.setValue('fiatCurrency', 'usd');
            result.current.setValue('fiatValue', '100');
        });
        // handleRequestThunk is mocked, add quotes manually
        act(() => {
            store.dispatch(tradingBuyActions.saveQuotes(quotes as BuyTrade[]));
        });

        // clear some value to make form invalid
        act(() => {
            result.current.setValue('fiatValue', undefined);
        });

        // 1st call - trading/setBuySelectedReceiveAccount
        // 2nd call - initial handleRequestThunkMock
        // 3rd call - manual saveQuotes
        // 4th call - clearQuotesAndQuotesRequest
        expect(dispatchSpy).toHaveBeenCalledTimes(4);
        expect(dispatchSpy).toHaveBeenNthCalledWith(4, {
            payload: undefined,
            type: 'trading/clearQuotesAndQuotesRequest',
        });
        expect(store.getState().wallet.tradingNew.buy.quotes).toEqual([]);
    });
});
