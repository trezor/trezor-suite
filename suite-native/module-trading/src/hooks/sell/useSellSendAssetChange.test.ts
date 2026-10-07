import { type Store } from '@reduxjs/toolkit';

import { tradingSellActions } from '@suite-common/trading';
import { type NativeAnalyticsDep, events } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { useForm } from '@suite-native/forms';
import { act, renderHookWithStoreProvider, screen } from '@suite-native/test-utils-store';
import { btcAsset, getBtcAccount } from '@suite-native/trading-fixtures';
import { type TradingRootState, sellActions } from '@suite-native/trading-state';
import { type SellFormValues } from '@suite-native/trading-types';

import { useSellSendAssetChange } from './useSellSendAssetChange';
import { createTradingTestStore } from '../../test-utils/tradingTestUtils';
import { sellFormValidationSchema } from '../../utils/sell/sellFormValidationSchema';

const reportMock = jest.fn();
const services: NativeAnalyticsDep = {
    analytics: mockNativeAnalytics(reportMock),
};

const btcAccount = getBtcAccount();

describe('useSellSendAssetChange', () => {
    let store: Store<TradingRootState>;
    let dispatchSpy: jest.SpyInstance;

    const renderSellSendAssetChange = async () =>
        await renderHookWithStoreProvider(
            () => {
                const form = useForm<SellFormValues>({ validation: sellFormValidationSchema });

                return { form, ...useSellSendAssetChange(form) };
            },
            { services: { ...services, store } },
        );

    beforeEach(() => {
        reportMock.mockClear();
        store = createTradingTestStore({ tradeType: 'sell' });
        dispatchSpy = jest.spyOn(store, 'dispatch');
    });

    afterEach(async () => {
        await screen.unmount();
    });

    it('should set the send asset and account key, dispatch the change and report cryptoFrom', async () => {
        const { result } = await renderSellSendAssetChange();

        await act(() => {
            result.current.changeAsset(btcAsset, btcAccount);
        });

        expect(result.current.selectedAsset).toEqual(btcAsset);
        expect(result.current.form.getValues('sendAsset')).toEqual(btcAsset);
        expect(dispatchSpy).toHaveBeenCalledWith(
            tradingSellActions.setTradingAccountKey(btcAccount.key),
        );
        expect(dispatchSpy).toHaveBeenCalledWith(sellActions.sendAssetChanged());
        expect(reportMock).toHaveBeenCalledWith({
            type: events.tradingParameterChangedEvent.name,
            payload: { type: 'sell', parameter: 'cryptoFrom' },
        });
    });

    it('should clear the send asset and the trading account key', async () => {
        const { result } = await renderSellSendAssetChange();
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
            tradingSellActions.setTradingAccountKey(undefined),
        );
    });
});
