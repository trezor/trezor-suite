import { type Store } from '@reduxjs/toolkit';

import { tradingExchangeActions } from '@suite-common/trading';
import { type NativeAnalyticsDep, events } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { useForm } from '@suite-native/forms';
import { act, renderHookWithStoreProvider, screen } from '@suite-native/test-utils-store';
import { btcAsset, ethAsset, getBtcAccount } from '@suite-native/trading-fixtures';
import { type TradingRootState, exchangeActions } from '@suite-native/trading-state';
import { type ExchangeFormValues } from '@suite-native/trading-types';

import { useExchangeSendAssetChange } from './useExchangeSendAssetChange';
import { createTradingTestStore } from '../../test-utils/tradingTestUtils';
import { exchangeFormValidationSchema } from '../../utils/exchange/exchangeFormValidationSchema';

const reportMock = jest.fn();
const services: NativeAnalyticsDep = {
    analytics: mockNativeAnalytics(reportMock),
};

const btcAccount = getBtcAccount();

describe('useExchangeSendAssetChange', () => {
    let store: Store<TradingRootState>;
    let dispatchSpy: jest.SpyInstance;

    const renderExchangeSendAssetChange = async () =>
        await renderHookWithStoreProvider(
            () => {
                const form = useForm<ExchangeFormValues>({
                    validation: exchangeFormValidationSchema,
                });

                return { form, ...useExchangeSendAssetChange(form) };
            },
            { services: { ...services, store } },
        );

    beforeEach(() => {
        reportMock.mockClear();
        store = createTradingTestStore({ tradeType: 'exchange' });
        dispatchSpy = jest.spyOn(store, 'dispatch');
    });

    afterEach(async () => {
        await screen.unmount();
    });

    it('should set the send asset and account key, dispatch the change and report cryptoFrom', async () => {
        const { result } = await renderExchangeSendAssetChange();

        await act(() => {
            result.current.changeAsset(btcAsset, btcAccount);
        });

        expect(result.current.selectedAsset).toEqual(btcAsset);
        expect(result.current.form.getValues('sendAsset')).toEqual(btcAsset);
        expect(dispatchSpy).toHaveBeenCalledWith(
            tradingExchangeActions.setTradingAccountKey(btcAccount.key),
        );
        expect(dispatchSpy).toHaveBeenCalledWith(exchangeActions.sendAssetChanged());
        expect(reportMock).toHaveBeenCalledWith({
            type: events.tradingParameterChangedEvent.name,
            payload: { type: 'exchange', parameter: 'cryptoFrom' },
        });
    });

    it('should clear the receive asset when it collides with the new send asset', async () => {
        const { result } = await renderExchangeSendAssetChange();
        await act(() => {
            result.current.form.setValue('sendAsset', ethAsset);
            result.current.form.setValue('receiveAsset', btcAsset);
        });
        dispatchSpy.mockClear();

        await act(() => {
            result.current.changeAsset(btcAsset);
        });

        expect(result.current.form.getValues('sendAsset')).toEqual(btcAsset);
        expect(result.current.form.getValues('receiveAsset')).toBeUndefined();
        expect(dispatchSpy).toHaveBeenCalledWith(exchangeActions.receiveAssetChanged());
        expect(reportMock).toHaveBeenCalledWith({
            type: events.tradingParameterChangedEvent.name,
            payload: { type: 'exchange', parameter: 'cryptoTo' },
        });
    });

    it('should clear the send asset and the trading account key', async () => {
        const { result } = await renderExchangeSendAssetChange();
        await act(() => {
            result.current.changeAsset(btcAsset, btcAccount);
        });
        dispatchSpy.mockClear();

        await act(() => {
            result.current.clearAsset();
        });

        expect(result.current.selectedAsset).toBeUndefined();
        expect(result.current.form.getValues('sendAsset')).toBeUndefined();
        expect(dispatchSpy).toHaveBeenCalledWith(
            tradingExchangeActions.setTradingAccountKey(undefined),
        );
    });
});
