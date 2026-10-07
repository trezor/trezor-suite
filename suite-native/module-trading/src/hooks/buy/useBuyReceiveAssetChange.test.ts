import { type Store } from '@reduxjs/toolkit';

import { type NativeAnalyticsDep, events } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { useForm } from '@suite-native/forms';
import { act, renderHookWithStoreProvider, screen } from '@suite-native/test-utils-store';
import { btcAsset, ethAsset, usdcAsset } from '@suite-native/trading-fixtures';
import { type TradingRootState, buyActions } from '@suite-native/trading-state';
import { type BuyFormValues } from '@suite-native/trading-types';

import { useBuyReceiveAssetChange } from './useBuyReceiveAssetChange';
import { createTradingTestStore } from '../../test-utils/tradingTestUtils';
import { buyFormValidationSchema } from '../../utils/buy/buyFormValidationSchema';

const reportMock = jest.fn();
const services: NativeAnalyticsDep = {
    analytics: mockNativeAnalytics(reportMock),
};

describe('useBuyReceiveAssetChange', () => {
    let store: Store<TradingRootState>;
    let dispatchSpy: jest.SpyInstance;

    const renderBuyReceiveAssetChange = async () =>
        await renderHookWithStoreProvider(
            () => {
                const form = useForm<BuyFormValues>({ validation: buyFormValidationSchema });

                return { form, ...useBuyReceiveAssetChange(form) };
            },
            { services: { ...services, store } },
        );

    beforeEach(() => {
        reportMock.mockClear();
        store = createTradingTestStore({ tradeType: 'buy' });
        dispatchSpy = jest.spyOn(store, 'dispatch');
    });

    afterEach(async () => {
        await screen.unmount();
    });

    it('should set the asset, dispatch the asset change and report cryptoTo', async () => {
        const { result } = await renderBuyReceiveAssetChange();

        await act(() => {
            result.current.changeAsset(btcAsset);
        });

        expect(result.current.selectedAsset).toEqual(btcAsset);
        expect(result.current.form.getValues('asset')).toEqual(btcAsset);
        expect(dispatchSpy).toHaveBeenCalledWith(buyActions.assetChanged());
        expect(reportMock).toHaveBeenCalledWith({
            type: events.tradingParameterChangedEvent.name,
            payload: { type: 'buy', parameter: 'cryptoTo' },
        });
    });

    it('should dispatch the token change when switching within the same network', async () => {
        const { result } = await renderBuyReceiveAssetChange();
        await act(() => {
            result.current.changeAsset(ethAsset);
        });
        dispatchSpy.mockClear();

        await act(() => {
            result.current.changeAsset(usdcAsset);
        });

        expect(result.current.selectedAsset).toEqual(usdcAsset);
        expect(dispatchSpy).toHaveBeenCalledWith(buyActions.assetTokenChanged());
        expect(dispatchSpy).not.toHaveBeenCalledWith(buyActions.assetChanged());
    });

    it('should clear the asset and dispatch the asset change', async () => {
        const { result } = await renderBuyReceiveAssetChange();
        await act(() => {
            result.current.changeAsset(btcAsset);
        });
        dispatchSpy.mockClear();

        await act(() => {
            result.current.clearAsset();
        });

        expect(result.current.selectedAsset).toBeUndefined();
        expect(result.current.form.getValues('asset')).toBeUndefined();
        expect(dispatchSpy).toHaveBeenCalledWith(buyActions.assetChanged());
    });
});
