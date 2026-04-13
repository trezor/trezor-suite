import { type EnhancedStore } from '@reduxjs/toolkit';

import { Form } from '@suite-native/forms';
import {
    fireEvent,
    initStore,
    renderHookWithStoreProvider,
    renderWithStoreProvider,
    screen,
} from '@suite-native/test-utils-store';
import { getInitializedTradingState } from '@suite-native/trading-fixtures';
import { type BuyFormType } from '@suite-native/trading-types';
import { FirmwareType } from '@trezor/connect';

import { useBuyForm } from '../../../hooks/buy/useBuyForm';
import { BuyTradeableAssetPicker } from '../BuyTradeableAssetPicker';

describe('BuyTradeableAssetPicker', () => {
    let store: EnhancedStore;
    let form: BuyFormType;

    const initPreloadedStore = (firmwareType: FirmwareType) =>
        initStore({
            device: { selectedDevice: { firmwareType } },
            wallet: { trading: getInitializedTradingState() },
        });

    const renderFormHook = () => {
        const { result } = renderHookWithStoreProvider(() => useBuyForm(), {
            store,
        });

        return result.current;
    };

    const renderTradeableAssetPicker = () =>
        renderWithStoreProvider(
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
            store = initPreloadedStore(FirmwareType.Universal).store;
            form = renderFormHook();
        });

        it('should render "Select asset" button with caret', () => {
            const { getByLabelText } = renderTradeableAssetPicker();

            expect(getByLabelText('Select asset')).toHaveTextContent(/^Select asset.$/);
        });

        it('should render bottom sheet with all assets', () => {
            const { getByLabelText } = renderTradeableAssetPicker();

            expect(getByLabelText('Bitcoin')).toBeTruthy();
            expect(getByLabelText('USDC')).toBeTruthy();
        });
    });

    describe('with BTC-only firmware', () => {
        beforeEach(() => {
            store = initPreloadedStore(FirmwareType.BitcoinOnly).store;
            form = renderFormHook();
        });

        it('should preselect BTC and do not render caret', () => {
            const { getByLabelText } = renderTradeableAssetPicker();

            expect(getByLabelText('Select asset')).toHaveTextContent('BTC');
        });

        it('should not render bottom sheet at all', () => {
            const { queryByLabelText } = renderTradeableAssetPicker();

            expect(queryByLabelText('Bitcoin')).toBeNull();
        });

        it('should do nothing on button or input press', () => {
            const { getByLabelText } = renderTradeableAssetPicker();

            // no need to act as there should be no action
            fireEvent.press(getByLabelText('Select asset'));
            fireEvent.press(getByLabelText('You get'));

            expect(getByLabelText('Select asset')).toHaveTextContent('BTC');
        });
    });
});
