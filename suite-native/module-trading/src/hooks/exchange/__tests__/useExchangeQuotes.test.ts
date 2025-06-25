import {
    INVITY_API_RELOAD_QUOTES_AFTER_SECONDS,
    tradingExchangeActions,
} from '@suite-common/trading';
import {
    PreloadedState,
    TestStore,
    act,
    initStore,
    renderHookWithStoreProviderAsync,
} from '@suite-native/test-utils';
import { PROTO } from '@trezor/connect';

import { getBtcAccount, getEthAccount } from '../../../__fixtures__/account';
import { exchangeQuotes } from '../../../__fixtures__/exchangeQuotes';
import { btcAsset, ethAsset, usdcAsset, usdtAsset } from '../../../__fixtures__/tradeableAssets';
import { getInitializedTradingState } from '../../../__fixtures__/tradingState';
import { ExchangeFormValues } from '../../../types/exchange';
import { useExchangeForm } from '../useExchangeForm';
import { useExchangeQuotes } from '../useExchangeQuotes';

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
    exchangeThunks: {
        handleRequestThunk: (payload: unknown) => ({
            type: 'handleRequestThunkMock',
            payload,
        }),
    },
}));

describe('useExchangeQuotes', () => {
    const getInitializedStore = async (bitcoinAmountUnit = PROTO.AmountUnit.BITCOIN) => {
        const preloadedState: PreloadedState = {
            wallet: {
                tradingNew: getInitializedTradingState(),
                accounts: [getBtcAccount(), getEthAccount()],
                settings: {
                    bitcoinAmountUnit,
                },
            },
        };

        return await initStore(preloadedState);
    };

    const renderUseExchangeQuotes = (store: TestStore) =>
        renderHookWithStoreProviderAsync(
            () => {
                const form = useExchangeForm();
                useExchangeQuotes(form);

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
        const { result } = await renderUseExchangeQuotes(store);
        const form = result.current;

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
                    receiveCryptoSelect: { value: 'ethereum' },
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
    });

    it('should respect sats setting', async () => {
        const store = await getInitializedStore(PROTO.AmountUnit.SATOSHI);
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const { result } = await renderUseExchangeQuotes(store);
        const form = result.current;

        act(() => {
            form.setValue('sendAsset', btcAsset);
            form.setValue('receiveAsset', ethAsset);
            form.setValue('sendCryptoAmount', '0.1');
        });

        expect(dispatchSpy).toHaveBeenCalledWith({
            type: 'handleRequestThunkMock',
            payload: expect.objectContaining({ shouldSendInSats: true }),
        });
    });

    it.each<string>(['0', '-1'])(
        'should not query quotes when amount is zero or less',
        async amount => {
            const store = await getInitializedStore();
            const dispatchSpy = jest.spyOn(store, 'dispatch');
            const { result } = await renderUseExchangeQuotes(store);
            const form = result.current;

            act(() => {
                form.setValue('sendAsset', btcAsset);
                form.setValue('receiveAsset', ethAsset);
                form.setValue('sendCryptoAmount', amount);
            });

            expect(dispatchSpy).not.toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'handleRequestThunkMock',
                }),
            );
        },
    );

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
        ['sendAsset', usdcAsset],
        ['receiveAsset', usdtAsset],
        ['sendCryptoAmount', '0.2'],
    ])('should refetch quotes on %s value change', async (field, value) => {
        const store = await getInitializedStore();
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const { result } = await renderUseExchangeQuotes(store);
        const form = result.current;

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
    });

    it('should re-fetch quotes when re-fetch time elapsed', async () => {
        const store = await getInitializedStore();
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const { result, rerender } = await renderUseExchangeQuotes(store);
        const form = result.current;

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
    });

    it('should not re-fetch quotes when re-fetch time elapsed but not all required data are available', async () => {
        const store = await getInitializedStore();
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const { result, rerender } = await renderUseExchangeQuotes(store);
        const form = result.current;

        act(() => {
            form.setValue('sendAsset', btcAsset);
        });

        dispatchSpy.mockClear();

        mockTimeSpent = INVITY_API_RELOAD_QUOTES_AFTER_SECONDS;
        rerender({});

        expect(dispatchSpy).not.toHaveBeenCalled();
    });

    it('should clear quotes when data in form becomes invalid', async () => {
        const store = await getInitializedStore();
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const { result } = await renderUseExchangeQuotes(store);
        const form = result.current;

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
            result.current.setValue('sendCryptoAmount', undefined);
        });

        expect(dispatchSpy).toHaveBeenCalledTimes(1);
        expect(dispatchSpy).toHaveBeenLastCalledWith({
            payload: undefined,
            type: 'tradingExchange/clearQuotesAndQuotesRequest',
        });
        expect(store.getState().wallet.tradingNew.exchange.quotes).toEqual([]);
    });
});
