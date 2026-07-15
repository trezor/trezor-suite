import { Form } from '@suite-native/forms';
import { getTranslation } from '@suite-native/intl';
import { type TestStore, fireEvent, screen } from '@suite-native/test-utils-store';
import { type BuyFormType } from '@suite-native/trading-types';
import { FirmwareType } from '@trezor/connect';

import {
    createTradingLightStore,
    renderHookWithTradingProvider,
    renderWithTradingProvider,
} from '../../../__tests__/tradingTestUtils';
import { useBuyForm } from '../../../hooks/buy/useBuyForm';
import { BuyTradeableAssetPicker } from '../BuyTradeableAssetPicker';

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
            store,
        });

        return result.current;
    };

    const renderTradeableAssetPicker = () =>
        renderWithTradingProvider(
            <Form form={form}>
                <BuyTradeableAssetPicker />
            </Form>,
            { store },
        );

    afterEach(() => {
        screen.unmount();
    });

    describe('with regular firmware', () => {
        beforeEach(() => {
            store = initPreloadedStore(FirmwareType.Universal);
            form = renderFormHook();
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
            const { getByLabelText } = renderTradeableAssetPicker();

            expect(getByLabelText('Bitcoin')).toBeTruthy();
            expect(getByLabelText('USDC')).toBeTruthy();
        });
    });

    describe('with BTC-only firmware', () => {
        beforeEach(() => {
            store = initPreloadedStore(FirmwareType.BitcoinOnly);
            form = renderFormHook();
        });

        it('should preselect BTC and do not render caret', () => {
            const { getByLabelText } = renderTradeableAssetPicker();

            expect(
                getByLabelText(getTranslation('moduleTrading.selectCoin.buttonTitle')),
            ).toHaveTextContent('BTC');
        });

        it('should not render bottom sheet at all', () => {
            const { queryByLabelText } = renderTradeableAssetPicker();

            expect(queryByLabelText('Bitcoin')).toBeNull();
        });

        it('should do nothing on button or input press', () => {
            const { getByLabelText } = renderTradeableAssetPicker();

            // no need to act as there should be no action
            fireEvent.press(getByLabelText(getTranslation('moduleTrading.selectCoin.buttonTitle')));
            fireEvent.press(getByLabelText(getTranslation('moduleTrading.selectCoin.amountLabel')));

            expect(
                getByLabelText(getTranslation('moduleTrading.selectCoin.buttonTitle')),
            ).toHaveTextContent('BTC');
        });
    });
});
