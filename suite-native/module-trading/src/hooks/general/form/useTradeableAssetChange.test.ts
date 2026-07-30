import { tradingExchangeActions } from '@suite-common/trading';
import { type NativeAnalyticsDep, events } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { type UseFormReturn } from '@suite-native/forms';
import { type TestStore, renderHookWithStoreProvider } from '@suite-native/test-utils-store';
import { btcAsset, ethAsset, getBtcAccount, usdcAsset } from '@suite-native/trading-fixtures';
import { buyActions, exchangeActions } from '@suite-native/trading-state';

import { useTradeableAssetChange } from './useTradeableAssetChange';
import { createTradingLightStore } from '../../../test-utils/tradingTestUtils';

const reportMock = jest.fn();
const services: NativeAnalyticsDep = {
    analytics: mockNativeAnalytics(reportMock),
};

const btcAccount = getBtcAccount();

type MockForm = {
    setValue: jest.Mock;
    getValues: jest.Mock;
};

const createMockForm = (counterpartAsset?: unknown): MockForm => ({
    setValue: jest.fn(),
    getValues: jest.fn().mockReturnValue(counterpartAsset),
});

describe('useTradeableAssetChange', () => {
    let store: TestStore;
    let setSelectedValue: jest.Mock;

    beforeEach(() => {
        reportMock.mockClear();
        store = createTradingLightStore({ tradeType: 'exchange' });
        setSelectedValue = jest.fn();
    });

    const renderChangeAsset = (
        config: Omit<Partial<Parameters<typeof useTradeableAssetChange>[0]>, 'form'> & {
            form: MockForm;
        },
    ) => {
        const { result } = renderHookWithStoreProvider(
            () =>
                useTradeableAssetChange({
                    tradingType: 'exchange',
                    selectedValue: undefined,
                    setSelectedValue,
                    analyticsParameter: 'cryptoFrom',
                    getAssetChangedAction: exchangeActions.sendAssetChanged,
                    ...config,
                    form: config.form as unknown as UseFormReturn<never>,
                }),
            { store, services },
        );

        return result.current;
    };

    it('should not apply any change effects when the selected asset is unchanged (dedup guard)', () => {
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const changeAsset = renderChangeAsset({
            form: createMockForm(),
            selectedValue: btcAsset,
        });

        changeAsset(btcAsset);

        expect(setSelectedValue).not.toHaveBeenCalled();
        expect(dispatchSpy).not.toHaveBeenCalled();
        expect(reportMock).not.toHaveBeenCalled();
    });

    it('should still set the trading account key before the dedup guard returns', () => {
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const changeAsset = renderChangeAsset({
            form: createMockForm(),
            selectedValue: btcAsset,
            getSetTradingAccountKeyAction: tradingExchangeActions.setTradingAccountKey,
        });

        changeAsset(btcAsset, btcAccount);

        expect(dispatchSpy).toHaveBeenCalledWith(
            tradingExchangeActions.setTradingAccountKey(btcAccount.key),
        );
        expect(setSelectedValue).not.toHaveBeenCalled();
    });

    it('should clear the amount and dispatch the base action on a cross-network change', () => {
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const form = createMockForm();
        const changeAsset = renderChangeAsset({
            form,
            selectedValue: btcAsset,
            amountField: 'sendCryptoAmount',
            getAssetChangedAction: exchangeActions.sendAssetChanged,
            getAssetTokenChangedAction: exchangeActions.receiveTokenChanged,
        });

        changeAsset(usdcAsset);

        expect(setSelectedValue).toHaveBeenCalledWith(usdcAsset);
        expect(form.setValue).toHaveBeenCalledWith('sendCryptoAmount', undefined, {
            shouldValidate: true,
        });
        expect(dispatchSpy).toHaveBeenCalledWith(exchangeActions.sendAssetChanged());
        expect(dispatchSpy).not.toHaveBeenCalledWith(exchangeActions.receiveTokenChanged());
    });

    it('should dispatch the token action when the network symbol is unchanged', () => {
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const changeAsset = renderChangeAsset({
            form: createMockForm(),
            tradingType: 'buy',
            selectedValue: ethAsset,
            getAssetChangedAction: buyActions.assetChanged,
            getAssetTokenChangedAction: buyActions.assetTokenChanged,
        });

        // usdcAsset is an Ethereum token, so switching from native ETH is a same-network change.
        changeAsset(usdcAsset);

        expect(dispatchSpy).toHaveBeenCalledWith(buyActions.assetTokenChanged());
        expect(dispatchSpy).not.toHaveBeenCalledWith(buyActions.assetChanged());
    });

    it('should not report analytics when shouldReportAnalytics is false', () => {
        const changeAsset = renderChangeAsset({
            form: createMockForm(),
            selectedValue: btcAsset,
        });

        changeAsset(usdcAsset, undefined, { shouldReportAnalytics: false });

        expect(setSelectedValue).toHaveBeenCalledWith(usdcAsset);
        expect(reportMock).not.toHaveBeenCalled();
    });

    it('should clear the counterpart asset and dispatch its action on collision', () => {
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const form = createMockForm(usdcAsset);
        const changeAsset = renderChangeAsset({
            form,
            selectedValue: btcAsset,
            analyticsParameter: 'cryptoFrom',
            getAssetChangedAction: exchangeActions.sendAssetChanged,
            collision: {
                counterpartAssetField: 'receiveAsset',
                counterpartAnalyticsParameter: 'cryptoTo',
                getCounterpartChangedAction: exchangeActions.receiveAssetChanged,
            },
        });

        changeAsset(usdcAsset);

        expect(form.setValue).toHaveBeenCalledWith('receiveAsset', undefined, undefined);
        expect(dispatchSpy).toHaveBeenCalledWith(exchangeActions.receiveAssetChanged());
        expect(reportMock).toHaveBeenCalledWith({
            type: events.tradingParameterChangedEvent.name,
            payload: { type: 'exchange', parameter: 'cryptoTo' },
        });
    });

    it('should clear the counterpart amount without a counterpart action when omitted', () => {
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const form = createMockForm(usdcAsset);
        const changeAsset = renderChangeAsset({
            form,
            selectedValue: btcAsset,
            analyticsParameter: 'cryptoTo',
            getAssetChangedAction: exchangeActions.receiveAssetChanged,
            collision: {
                counterpartAssetField: 'sendAsset',
                counterpartAmountField: 'sendCryptoAmount',
                counterpartAnalyticsParameter: 'cryptoFrom',
            },
        });

        changeAsset(usdcAsset);

        expect(form.setValue).toHaveBeenCalledWith('sendAsset', undefined, undefined);
        expect(form.setValue).toHaveBeenCalledWith('sendCryptoAmount', undefined, {
            shouldValidate: true,
        });
        expect(dispatchSpy).not.toHaveBeenCalledWith(exchangeActions.sendAssetChanged());
        expect(reportMock).toHaveBeenCalledWith({
            type: events.tradingParameterChangedEvent.name,
            payload: { type: 'exchange', parameter: 'cryptoFrom' },
        });
    });
});
