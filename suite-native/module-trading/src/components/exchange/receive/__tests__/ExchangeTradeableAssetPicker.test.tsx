import { type NativeAnalyticsDep, events } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { featureFlagsInitialState } from '@suite-native/feature-flags';
import { Form } from '@suite-native/forms';
import { getTranslation } from '@suite-native/intl';
import { type TestStore, fireEvent, screen } from '@suite-native/test-utils-store';
import { btcAsset } from '@suite-native/trading-fixtures';
import { exchangeActions } from '@suite-native/trading-state';
import { type ExchangeFormType } from '@suite-native/trading-types';
import { FirmwareType } from '@trezor/connect';

import {
    createTradingLightStore,
    renderHookWithTradingProvider,
    renderWithTradingProvider,
} from '../../../../__tests__/tradingTestUtils';
import { useExchangeForm } from '../../../../hooks/exchange/useExchangeForm';
import { ExchangeTradeableAssetPicker } from '../ExchangeTradeableAssetPicker';

const reportMock = jest.fn();
const services: NativeAnalyticsDep = {
    analytics: mockNativeAnalytics(reportMock),
};

describe('ExchangeTradeableAssetPicker', () => {
    let store: TestStore;
    let form: ExchangeFormType;

    const initPreloadedStore = (firmwareType: FirmwareType) =>
        createTradingLightStore({
            tradeType: 'exchange',
            overrides: {
                device: { selectedDevice: { firmwareType } },
                featureFlags: {
                    ...featureFlagsInitialState,
                },
            },
        });

    const renderFormHook = () => {
        const { result } = renderHookWithTradingProvider(() => useExchangeForm(), {
            services,
            store,
        });

        return result.current;
    };

    const renderTradeableAssetPicker = () =>
        renderWithTradingProvider(<ExchangeTradeableAssetPicker />, {
            services,
            store,
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
        });

    beforeEach(() => {
        reportMock.mockClear();
        store = initPreloadedStore(FirmwareType.Universal);
        form = renderFormHook();
    });

    afterEach(() => {
        screen.unmount();
    });

    it('should render "Select asset" button with caret', () => {
        const { getByLabelText } = renderTradeableAssetPicker();

        expect(
            getByLabelText(getTranslation('moduleTrading.selectCoin.buttonTitle')),
        ).toHaveTextContent(
            new RegExp(`^${getTranslation('moduleTrading.selectCoin.buttonTitle')}.$`),
        );
    });

    it('should render bottom sheet with all assets', () => {
        const { getAllByText } = renderTradeableAssetPicker();

        expect(getAllByText('Bitcoin')).toBeTruthy();
        expect(getAllByText('USDC')).toBeTruthy();
    });

    it('should apply receive asset change effects on item press', () => {
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const { getByLabelText } = renderTradeableAssetPicker();

        fireEvent.press(getByLabelText('Bitcoin'));

        expect(dispatchSpy).toHaveBeenCalledWith(exchangeActions.receiveAssetChanged());
        expect(reportMock).toHaveBeenCalledWith({
            type: events.tradingParameterChangedEvent.name,
            payload: {
                type: 'exchange',
                parameter: 'cryptoTo',
            },
        });
    });

    it('should clear the send asset and its typed amount when it collides with the newly selected receive asset', () => {
        form.setValue('sendAsset', btcAsset);
        form.setValue('sendCryptoAmount', '1');
        const { getByLabelText } = renderTradeableAssetPicker();

        fireEvent.press(getByLabelText('Bitcoin'));

        expect(form.getValues('sendAsset')).toBeUndefined();
        expect(form.getValues('sendCryptoAmount')).toBeUndefined();
        expect(reportMock).toHaveBeenCalledWith({
            type: events.tradingParameterChangedEvent.name,
            payload: {
                type: 'exchange',
                parameter: 'cryptoFrom',
            },
        });
    });
});
