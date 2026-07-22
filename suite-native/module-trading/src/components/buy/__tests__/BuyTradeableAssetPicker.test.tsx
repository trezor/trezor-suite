import { type NativeAnalyticsDep, events } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { Form } from '@suite-native/forms';
import { getTranslation } from '@suite-native/intl';
import { act } from '@suite-native/test-utils';
import { type TestStore, fireEvent, screen } from '@suite-native/test-utils-store';
import { buyActions } from '@suite-native/trading-state';
import { type BuyFormType } from '@suite-native/trading-types';
import { FirmwareType } from '@trezor/connect';

import {
    createTradingLightStore,
    renderHookWithTradingProvider,
    renderWithTradingProvider,
} from '../../../__tests__/tradingTestUtils';
import { useBuyForm } from '../../../hooks/buy/useBuyForm';
import { BuyTradeableAssetPicker } from '../BuyTradeableAssetPicker';

const reportMock = jest.fn();
const services: NativeAnalyticsDep = {
    analytics: mockNativeAnalytics(reportMock),
};

describe('BuyTradeableAssetPicker', () => {
    let store: TestStore;
    let form: BuyFormType;

    const initPreloadedStore = (firmwareType: FirmwareType) =>
        createTradingLightStore({
            tradeType: 'buy',
            overrides: {
                device: { selectedDevice: { firmwareType } },
            },
        });

    const renderFormHook = () => {
        const { result } = renderHookWithTradingProvider(() => useBuyForm(), {
            services,
            store,
        });

        return result.current;
    };

    const renderTradeableAssetPicker = async () => {
        const res = renderWithTradingProvider(
            <Form form={form}>
                <BuyTradeableAssetPicker />
            </Form>,
            { services, store },
        );
        await act(async () => {
            await act(() => Promise.resolve());
        });

        return res;
    };

    afterEach(() => {
        screen.unmount();
    });

    describe('with regular firmware', () => {
        beforeEach(() => {
            reportMock.mockClear();
            store = initPreloadedStore(FirmwareType.Universal);
            form = renderFormHook();
        });

        it('should render "Select asset" button with caret', async () => {
            const { getByLabelText } = await renderTradeableAssetPicker();

            expect(
                getByLabelText(getTranslation('moduleTrading.selectCoin.buttonTitle')),
            ).toHaveTextContent(
                new RegExp(`^${getTranslation('moduleTrading.selectCoin.buttonTitle')}.$`),
            );
        });

        it('should render bottom sheet with all assets', async () => {
            const { getByLabelText } = await renderTradeableAssetPicker();

            expect(getByLabelText('Bitcoin')).toBeTruthy();
            expect(getByLabelText('USDC')).toBeTruthy();
        });

        it('should apply buy asset change effects on item press', () => {
            form.setValue('cryptoValue', '0.1');
            const dispatchSpy = jest.spyOn(store, 'dispatch');
            const { getByLabelText } = renderTradeableAssetPicker();

            fireEvent.press(getByLabelText('Bitcoin'));

            expect(form.getValues('cryptoValue')).toBeUndefined();
            expect(dispatchSpy).toHaveBeenCalledWith(buyActions.assetChanged());
            expect(reportMock).toHaveBeenCalledWith({
                type: events.tradingParameterChangedEvent.name,
                payload: {
                    type: 'buy',
                    parameter: 'cryptoTo',
                },
            });
        });
    });

    describe('with BTC-only firmware', () => {
        beforeEach(() => {
            reportMock.mockClear();
            store = initPreloadedStore(FirmwareType.BitcoinOnly);
            form = renderFormHook();
        });

        it('should preselect BTC and do not render caret', async () => {
            const { getByLabelText } = await renderTradeableAssetPicker();

            expect(
                getByLabelText(getTranslation('moduleTrading.selectCoin.buttonTitle')),
            ).toHaveTextContent('BTC');
        });

        it('should not render bottom sheet at all', async () => {
            const { queryByLabelText } = await renderTradeableAssetPicker();

            expect(queryByLabelText('Bitcoin')).toBeNull();
        });

        it('should do nothing on button or input press', async () => {
            const { getByLabelText } = await renderTradeableAssetPicker();

            // no need to act as there should be no action
            fireEvent.press(getByLabelText(getTranslation('moduleTrading.selectCoin.buttonTitle')));
            fireEvent.press(getByLabelText(getTranslation('moduleTrading.selectCoin.amountLabel')));

            expect(
                getByLabelText(getTranslation('moduleTrading.selectCoin.buttonTitle')),
            ).toHaveTextContent('BTC');
        });
    });
});
