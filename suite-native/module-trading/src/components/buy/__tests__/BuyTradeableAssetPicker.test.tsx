import { EnhancedStore } from '@reduxjs/toolkit';

import { Form } from '@suite-native/forms';
import { fireEvent, screen } from '@suite-native/test-utils';
// eslint-disable-next-line local-rules/no-package-deep-imports
import {
    initStore,
    renderHookWithStoreProviderAsync,
    renderWithStoreProviderAsync,
} from '@suite-native/test-utils/store';
import { getInitializedTradingState } from '@suite-native/trading-fixtures';
import { BuyFormType } from '@suite-native/trading-types';
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

    const renderFormHook = async () => {
        const { result } = await renderHookWithStoreProviderAsync(() => useBuyForm(), {
            store,
        });

        return result.current;
    };

    const renderTradeableAssetPicker = () =>
        renderWithStoreProviderAsync(
            <Form form={form}>
                <BuyTradeableAssetPicker />
            </Form>,
            { store },
        );

    afterEach(() => {
        screen.unmount();
    });

    describe('with regular firmware', () => {
        beforeEach(async () => {
            store = (await initPreloadedStore(FirmwareType.Universal)).store;
            form = await renderFormHook();
        });

        it('should render "Select asset" button with caret', async () => {
            const { getByLabelText } = await renderTradeableAssetPicker();

            expect(getByLabelText('Select asset')).toHaveTextContent(/^Select asset.$/);
        });

        it('should render bottom sheet with all assets', async () => {
            const { getByLabelText } = await renderTradeableAssetPicker();

            expect(getByLabelText('Bitcoin')).toBeTruthy();
            expect(getByLabelText('USDC')).toBeTruthy();
        });
    });

    describe('with BTC-only firmware', () => {
        beforeEach(async () => {
            store = (await initPreloadedStore(FirmwareType.BitcoinOnly)).store;
            form = await renderFormHook();
        });

        it('should preselect BTC and do not render caret', async () => {
            const { getByLabelText } = await renderTradeableAssetPicker();

            expect(getByLabelText('Select asset')).toHaveTextContent('BTC');
        });

        it('should not render bottom sheet at all', async () => {
            const { queryByLabelText } = await renderTradeableAssetPicker();

            expect(queryByLabelText('Bitcoin')).toBeNull();
        });

        it('should do nothing on button or input press', async () => {
            const { getByLabelText } = await renderTradeableAssetPicker();

            // no need to act as there should be no action
            fireEvent.press(getByLabelText('Select asset'));
            fireEvent.press(getByLabelText('You get'));

            expect(getByLabelText('Select asset')).toHaveTextContent('BTC');
        });
    });
});
