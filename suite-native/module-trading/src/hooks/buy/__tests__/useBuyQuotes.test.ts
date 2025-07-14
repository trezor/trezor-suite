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

import { getBtcAccount } from '../../../__fixtures__/account';
import quotes from '../../../__fixtures__/quotes.json';
import { bnbAsset, usdcAsset } from '../../../__fixtures__/tradeableAssets';
import { getInitializedTradingState } from '../../../__fixtures__/tradingState';
import { BuyFormValues } from '../../../types/buy';
import { useBuyForm } from '../useBuyForm';
import { useBuyQuotes } from '../useBuyQuotes';

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

    selectTradingCoinInfoByCryptoId: (state: any, cryptoId: string) => {
        // Mock coinInfo for test assets
        const mockCoinInfo = {
            'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': {
                symbol: 'usdc',
                name: 'USDC',
                coingeckoId: 'usd-coin',
                services: {
                    buy: true,
                    sell: true,
                    exchange: true,
                },
            },
            binancecoin: {
                symbol: 'bnb',
                name: 'BNB',
                coingeckoId: 'binancecoin',
                services: {
                    buy: true,
                    sell: true,
                    exchange: true,
                },
            },
        };

        return mockCoinInfo[cryptoId as keyof typeof mockCoinInfo];
    },
}));

describe('useBuyQuotes', () => {
    const getInitializedStore = async () => {
        const preloadedState: PreloadedState = {
            wallet: { tradingNew: getInitializedTradingState(), accounts: [getBtcAccount()] },
        };
        preloadedState.wallet!.tradingNew!.buy!.tradingAccountKey = 'btc-account-1';

        return await initStore(preloadedState);
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
        store.dispatch(tradingBuyActions.saveQuotes(quotes as BuyTrade[]));
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
            dispatchSpy.mockClear();
            act(() => {
                result.current.setValue('fiatValue', '100');
            });

            act(() => {
                result.current.setValue(field, value);
            });

            // 1st call - buyActions/assetChanged
            // 2nd call - buyActions/fiatCurrencyChanged
            // 3rd call - initial handleRequestThunkMock
            // 4th call - re-fetch of handleRequestThunkMock
            // 5th call - re-fetch of handleRequestThunkMock
            // 6th call - re-fetch of handleRequestThunkMock
            expect(dispatchSpy).toHaveBeenCalledTimes(2);
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
        act(() => {
            result.current.setValue('asset', usdcAsset);
            result.current.setValue('fiatCurrency', 'usd');
        });

        act(() => {
            result.current.setValue('fiatValue', '100');
        });

        expect(dispatchSpy).toHaveBeenCalledTimes(5);

        mockTimeSpent = INVITY_API_RELOAD_QUOTES_AFTER_SECONDS;
        rerender({});

        // 1st call - tradingBuy/assetChanged
        // 2nd call - tradingBuy/fiatCurrencyChanged
        // 3rd call - initial handleRequestThunkMock
        // 4th call - re-fetch of handleRequestThunkMock
        // 5th call - re-fetch of handleRequestThunkMock
        // 6th call - re-fetch of handleRequestThunkMock
        expect(dispatchSpy).toHaveBeenCalledTimes(6);
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
            store.dispatch(tradingBuyActions.saveQuotes(quotes as BuyTrade[]));
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
        expect(store.getState().wallet.tradingNew.buy.quotes).toEqual([]);
    });
});
