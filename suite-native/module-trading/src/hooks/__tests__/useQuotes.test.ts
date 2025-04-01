import type { BuyTrade } from 'invity-api';

import { tradingBuyActions } from '@suite-common/trading';
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

jest.mock('@trezor/react-utils', () => ({
    ...jest.requireActual('@trezor/react-utils'),
    useDebounce: () => (fn: () => unknown) => fn(),
}));

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

    it('should clear quotes on unmount', async () => {
        const store = await getInitializedStore();
        store.dispatch(tradingBuyActions.saveQuotes(quotes as BuyTrade[]));
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const { unmount } = await renderUseQuotes(store);

        unmount();

        expect(dispatchSpy).toHaveBeenCalledWith({ payload: [], type: '@trading-buy/saveQuotes' });
    });

    it.each([
        ['fiatValue', '1000'],
        ['fiatCurrency', 'czk'],
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
});
