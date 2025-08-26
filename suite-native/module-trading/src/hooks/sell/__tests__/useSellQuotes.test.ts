import { INVITY_API_RELOAD_QUOTES_AFTER_SECONDS, tradingSellActions } from '@suite-common/trading';
import {
    PreloadedState,
    TestStore,
    act,
    initStore,
    renderHookWithStoreProviderAsync,
} from '@suite-native/test-utils';

import { getBtcAccount } from '../../../__fixtures__/account';
import { sellQuotes } from '../../../__fixtures__/sellQuotes';
import { bnbAsset, usdcAsset } from '../../../__fixtures__/tradeableAssets';
import { getWalletState } from '../../../__fixtures__/walletState';
import { SellFormValues } from '../../../types/sell';
import { useSellForm } from '../useSellForm';
import { useSellQuotes } from '../useSellQuotes';

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
    sellThunks: {
        handleRequestThunk: (payload: unknown) => ({
            type: 'handleRequestThunkMock',
            payload,
        }),
    },
}));

describe('useSellQuotes', () => {
    const getInitializedStore = async () => {
        const preloadedState: PreloadedState = {
            wallet: getWalletState({
                tradeType: 'sell',
            }),
        };
        preloadedState.wallet!.tradingNew!.sell!.tradingAccountKey = 'btc-account-1';

        return await initStore(preloadedState);
    };

    const renderUseSellQuotes = (store: TestStore) =>
        renderHookWithStoreProviderAsync(
            () => {
                const form = useSellForm();
                useSellQuotes(form);

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
        const { result } = await renderUseSellQuotes(store);

        act(() => {
            result.current.setValue('sendAsset', usdcAsset);
            result.current.setValue('fiatCurrency', 'usd');
            result.current.setValue('amountInCrypto', true);
        });
        act(() => {
            result.current.setValue('cryptoStringAmount', '1');
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
            const { result } = await renderUseSellQuotes(store);

            act(() => {
                result.current.setValue('sendAsset', bnbAsset);
                result.current.setValue('fiatCurrency', 'usd');
            });
            act(() => {
                result.current.setValue('cryptoStringAmount', amount);
            });

            expect(dispatchSpy).not.toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'handleRequestThunkMock',
                }),
            );
        },
    );

    it('should accept amount in fiat when requested', async () => {
        const store = await getInitializedStore();
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const { result } = await renderUseSellQuotes(store);

        act(() => {
            result.current.setValue('sendAsset', usdcAsset);
            result.current.setValue('fiatCurrency', 'usd');
            result.current.setValue('amountInCrypto', false);
        });
        act(() => {
            result.current.setValue('fiatStringAmount', '100');
        });

        expect(dispatchSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'handleRequestThunkMock',
            }),
        );
    });

    it('should clear sell state on unmount', async () => {
        const store = await getInitializedStore();
        store.dispatch(tradingSellActions.saveQuotes(sellQuotes));
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const { unmount } = await renderUseSellQuotes(store);

        unmount();

        expect(dispatchSpy).toHaveBeenCalledWith({
            payload: undefined,
            type: 'tradingSell/clearState',
        });
    });

    it.each([
        ['fiatStringAmount', '1000'],
        ['country', 'CZ'],
        ['sendAccount', getBtcAccount('btc-account-2')],
    ] as [keyof SellFormValues, SellFormValues[keyof SellFormValues]][])(
        'should re-fetch quotes on %s value change',
        async (field, value) => {
            const store = await getInitializedStore();
            const dispatchSpy = jest.spyOn(store, 'dispatch');
            const { result } = await renderUseSellQuotes(store);
            act(() => {
                result.current.setValue('sendAsset', usdcAsset);
                result.current.setValue('fiatCurrency', 'usd');
            });
            act(() => {
                result.current.setValue('fiatStringAmount', '100');
            });

            dispatchSpy.mockClear();
            act(() => {
                result.current.setValue(field, value);
            });

            expect(dispatchSpy).toHaveBeenCalledTimes(1);
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
        const { result, rerender } = await renderUseSellQuotes(store);
        act(() => {
            result.current.setValue('sendAsset', usdcAsset);
            result.current.setValue('fiatCurrency', 'usd');
        });

        act(() => {
            result.current.setValue('fiatStringAmount', '100');
        });

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
        const { result, rerender } = await renderUseSellQuotes(store);

        dispatchSpy.mockClear();
        act(() => {
            result.current.setValue('fiatCurrency', 'usd');
        });

        mockTimeSpent = INVITY_API_RELOAD_QUOTES_AFTER_SECONDS;
        rerender({});

        expect(dispatchSpy).not.toHaveBeenCalled();
    });

    it('should clear quotes when data in form becomes invalid', async () => {
        const store = await getInitializedStore();
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const { result } = await renderUseSellQuotes(store);

        act(() => {
            result.current.setValue('sendAsset', usdcAsset);
            result.current.setValue('fiatCurrency', 'usd');
            result.current.setValue('fiatStringAmount', '100');
        });
        // handleRequestThunk is mocked, add quotes manually
        act(() => {
            store.dispatch(tradingSellActions.saveQuotes(sellQuotes));
        });

        dispatchSpy.mockClear();
        // clear some value to make form invalid
        act(() => {
            result.current.setValue('fiatStringAmount', undefined);
        });

        expect(dispatchSpy).toHaveBeenCalledTimes(1);
        expect(dispatchSpy).toHaveBeenLastCalledWith({
            payload: undefined,
            type: 'tradingSell/clearQuotesAndQuotesRequest',
        });
        expect(store.getState().wallet.tradingNew.sell.quotes).toEqual([]);
    });

    it('should not query quotes when form contains error', async () => {
        const store = await getInitializedStore();
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const { result } = await renderUseSellQuotes(store);

        act(() => {
            result.current.setValue('sendAsset', usdcAsset);
            result.current.setValue('fiatCurrency', 'usd');
            result.current.setValue('amountInCrypto', true);
            result.current.setValue('cryptoStringAmount', '1');
            result.current.setError('cryptoStringAmount', {
                type: 'manual',
                message: 'Some error',
            });
        });

        expect(dispatchSpy).not.toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'handleRequestThunkMock',
            }),
        );
    });
});
