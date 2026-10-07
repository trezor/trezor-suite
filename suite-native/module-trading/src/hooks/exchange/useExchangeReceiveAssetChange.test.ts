import { type Store } from '@reduxjs/toolkit';

import { type NativeAnalyticsDep, events } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { useForm } from '@suite-native/forms';
import { act, renderHookWithStoreProvider, screen } from '@suite-native/test-utils-store';
import { btcAsset, ethAsset, usdcAsset } from '@suite-native/trading-fixtures';
import { type TradingRootState, exchangeActions } from '@suite-native/trading-state';
import { type ExchangeFormValues } from '@suite-native/trading-types';

import { useExchangeReceiveAssetChange } from './useExchangeReceiveAssetChange';
import { createTradingTestStore } from '../../test-utils/tradingTestUtils';
import { exchangeFormValidationSchema } from '../../utils/exchange/exchangeFormValidationSchema';
import { useContextForTradingForm } from '../general/form/useContextForTradingForm';

const reportMock = jest.fn();
const services: NativeAnalyticsDep = {
    analytics: mockNativeAnalytics(reportMock),
};

describe('useExchangeReceiveAssetChange', () => {
    let store: Store<TradingRootState>;
    let dispatchSpy: jest.SpyInstance;

    const renderExchangeReceiveAssetChange = async () =>
        await renderHookWithStoreProvider(
            () => {
                const { context } = useContextForTradingForm(undefined);
                const form = useForm<ExchangeFormValues>({
                    validation: exchangeFormValidationSchema,
                    context,
                });

                return { form, ...useExchangeReceiveAssetChange(form) };
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

    it('should set the receive asset, dispatch the change and report cryptoTo', async () => {
        const { result } = await renderExchangeReceiveAssetChange();

        await act(() => {
            result.current.changeAsset(btcAsset);
        });

        expect(result.current.selectedAsset).toEqual(btcAsset);
        expect(result.current.form.getValues('receiveAsset')).toEqual(btcAsset);
        expect(dispatchSpy).toHaveBeenCalledWith(exchangeActions.receiveAssetChanged());
        expect(reportMock).toHaveBeenCalledWith({
            type: events.tradingParameterChangedEvent.name,
            payload: { type: 'exchange', parameter: 'cryptoTo' },
        });
    });

    it('should dispatch the token change when switching within the same network', async () => {
        const { result } = await renderExchangeReceiveAssetChange();
        await act(() => {
            result.current.changeAsset(ethAsset);
        });
        dispatchSpy.mockClear();

        await act(() => {
            result.current.changeAsset(usdcAsset);
        });

        expect(dispatchSpy).toHaveBeenCalledWith(exchangeActions.receiveTokenChanged());
        expect(dispatchSpy).not.toHaveBeenCalledWith(exchangeActions.receiveAssetChanged());
    });

    it('should clear the send asset and amount when they collide with the new receive asset', async () => {
        const { result } = await renderExchangeReceiveAssetChange();
        await act(() => {
            result.current.form.setValue('sendAsset', btcAsset);
            result.current.form.setValue('sendCryptoAmount', '1');
            result.current.form.setValue('receiveAsset', ethAsset);
        });

        await act(() => {
            result.current.changeAsset(btcAsset);
        });

        expect(result.current.form.getValues('receiveAsset')).toEqual(btcAsset);
        expect(result.current.form.getValues('sendAsset')).toBeUndefined();
        expect(result.current.form.getValues('sendCryptoAmount')).toBeUndefined();
        expect(reportMock).toHaveBeenCalledWith({
            type: events.tradingParameterChangedEvent.name,
            payload: { type: 'exchange', parameter: 'cryptoFrom' },
        });
    });

    it('should clear the receive asset and dispatch the receive asset change', async () => {
        const { result } = await renderExchangeReceiveAssetChange();
        await act(() => {
            result.current.changeAsset(btcAsset);
        });
        dispatchSpy.mockClear();

        await act(() => {
            result.current.clearAsset();
        });

        expect(result.current.selectedAsset).toBeUndefined();
        expect(result.current.form.getValues('receiveAsset')).toBeUndefined();
        expect(dispatchSpy).toHaveBeenCalledWith(exchangeActions.receiveAssetChanged());
    });
});
