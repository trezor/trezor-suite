import { tradingSellActions } from '@suite-common/trading';
import { EventType, analytics } from '@suite-native/analytics';
import { Form, useField } from '@suite-native/forms';
import {
    PreloadedState,
    TestStore,
    act,
    initStore,
    renderHook,
    renderHookWithStoreProviderAsync,
} from '@suite-native/test-utils';

import { getBtcAccount } from '../../../__fixtures__/account';
import { btcAsset, usdcAsset } from '../../../__fixtures__/tradeableAssets';
import { getWalletState } from '../../../__fixtures__/walletState';
import { sellActions } from '../../../reducers';
import { SellFormType } from '../../../types/sell';
import { useSellForm } from '../useSellForm';

describe('useSellForm', () => {
    let store: TestStore;

    const renderUseSellForm = () =>
        renderHookWithStoreProviderAsync(() => useSellForm(), { store });

    const getInitializedStore = async () => {
        const preloadedState: PreloadedState = {
            wallet: getWalletState({ tradeType: 'sell' }),
        };

        return await initStore(preloadedState);
    };

    beforeEach(async () => {
        store = await getInitializedStore();
    });

    describe('sendAccount', () => {
        it('should be undefined by default', async () => {
            const { result } = await renderUseSellForm();

            expect(result.current.getValues('sendAccount')).toBeUndefined();
        });

        it('should update sendAccount value when account in redux store is changed', async () => {
            const { result } = await renderUseSellForm();

            act(() => {
                store.dispatch(tradingSellActions.setTradingAccountKey('btc-account-1'));
            });

            expect(result.current.getValues('sendAccount')).toEqual(getBtcAccount('btc-account-1'));
        });
    });

    describe('sendAsset', () => {
        it('should clear crypto amount on change', async () => {
            const { result } = await renderUseSellForm();
            act(() => {
                result.current.setValue('sendAsset', btcAsset);
                result.current.setValue('cryptoStringAmount', '100');
            });

            act(() => {
                result.current.setValue('sendAsset', usdcAsset);
            });

            expect(result.current.getValues('cryptoStringAmount')).toBeUndefined();
        });

        it('should report change to analytics', async () => {
            const reportSpy = jest.spyOn(analytics, 'report');
            const { result } = await renderUseSellForm();

            act(() => {
                result.current.setValue('sendAsset', btcAsset);
            });

            expect(reportSpy).toHaveBeenCalledWith({
                type: EventType.TradingParameterChanged,
                payload: {
                    type: 'sell',
                    parameter: 'cryptoFrom',
                },
            });
        });

        it('should dispatch sendAssetChanged action', async () => {
            const dispatchSpy = jest.spyOn(store, 'dispatch');
            const { result } = await renderUseSellForm();

            act(() => {
                result.current.setValue('sendAsset', btcAsset);
            });

            expect(dispatchSpy).toHaveBeenCalledWith(sellActions.sendAssetChanged());
        });
    });

    describe('fiatCurrency', () => {
        it('should clear fiat amount on change', async () => {
            const { result } = await renderUseSellForm();
            act(() => {
                result.current.setValue('fiatCurrency', 'czk');
                result.current.setValue('fiatStringAmount', '100');
            });

            act(() => {
                result.current.setValue('fiatCurrency', 'pln');
            });

            expect(result.current.getValues('cryptoStringAmount')).toBeUndefined();
        });

        it('should report change to analytics', async () => {
            const reportSpy = jest.spyOn(analytics, 'report');
            const { result } = await renderUseSellForm();

            act(() => {
                result.current.setValue('fiatCurrency', 'pln');
            });

            expect(reportSpy).toHaveBeenCalledWith({
                type: EventType.TradingParameterChanged,
                payload: {
                    type: 'sell',
                    parameter: 'fiat',
                },
            });
        });

        it('should dispatch sendAssetChanged action', async () => {
            const dispatchSpy = jest.spyOn(store, 'dispatch');
            const { result } = await renderUseSellForm();

            act(() => {
                result.current.setValue('fiatCurrency', 'pln');
            });

            expect(dispatchSpy).toHaveBeenCalledWith(sellActions.fiatCurrencyChanged());
        });
    });

    describe('cryptoStringAmount', () => {
        const renderUseCryptoStringAmountField = (form: SellFormType) => {
            const { result } = renderHook(() => useField({ name: 'cryptoStringAmount' }), {
                wrapper: ({ children }) => <Form form={form}>{children}</Form>,
            });

            return result;
        };

        it('should set amountInCrypto to true when user edits cryptoStringAmount', async () => {
            const { result } = await renderUseSellForm();
            const fieldResult = renderUseCryptoStringAmountField(result.current);

            act(() => {
                result.current.setValue('amountInCrypto', false);
                result.current.setValue('focusedValue', 'cryptoStringAmount');
                fieldResult.current.onChange('50');
            });

            expect(result.current.getValues('amountInCrypto')).toBe(true);
        });

        it('should clear fiatStringAmount when user edits cryptoStringAmount', async () => {
            const { result } = await renderUseSellForm();
            const fieldResult = renderUseCryptoStringAmountField(result.current);

            act(() => {
                result.current.setValue('fiatStringAmount', '100');
                result.current.setValue('focusedValue', 'cryptoStringAmount');
                fieldResult.current.onChange('50');
            });

            expect(result.current.getValues('fiatStringAmount')).toBeUndefined();
            expect(result.current.getValues('cryptoStringAmount')).toBe('50');
        });
    });

    describe('fiatStringAmount', () => {
        const renderUseFiatStringAmountField = (form: SellFormType) => {
            const { result } = renderHook(() => useField({ name: 'fiatStringAmount' }), {
                wrapper: ({ children }) => <Form form={form}>{children}</Form>,
            });

            return result;
        };

        it('should set amountInCrypto to false when user edits fiatStringAmount', async () => {
            const { result } = await renderUseSellForm();
            const fieldResult = renderUseFiatStringAmountField(result.current);

            act(() => {
                result.current.setValue('amountInCrypto', true);
                result.current.setValue('focusedValue', 'fiatStringAmount');
                fieldResult.current.onChange('50');
            });

            expect(result.current.getValues('amountInCrypto')).toBe(false);
        });

        it('should clear cryptoStringAmount when user edits fiatStringAmount', async () => {
            const { result } = await renderUseSellForm();
            const fieldResult = renderUseFiatStringAmountField(result.current);

            act(() => {
                result.current.setValue('cryptoStringAmount', '100');
                result.current.setValue('focusedValue', 'fiatStringAmount');
                fieldResult.current.onChange('50');
            });

            expect(result.current.getValues('cryptoStringAmount')).toBeUndefined();
            expect(result.current.getValues('fiatStringAmount')).toBe('50');
        });
    });
});
