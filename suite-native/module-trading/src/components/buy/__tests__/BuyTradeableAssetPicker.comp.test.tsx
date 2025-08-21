import { EnhancedStore } from '@reduxjs/toolkit';

import { Form } from '@suite-native/forms';
import {
    fireEvent,
    initStore,
    renderHookWithStoreProviderAsync,
    renderWithStoreProviderAsync,
} from '@suite-native/test-utils';
import { FirmwareType } from '@trezor/connect';

import { getInitializedTradingState } from '../../../__fixtures__/tradingState';
import { useBuyForm } from '../../../hooks/buy/useBuyForm';
import { BuyFormType } from '../../../types/buy';
import { BuyTradeableAssetPicker } from '../BuyTradeableAssetPicker';

describe('BuyTradeableAssetPicker', () => {
    let store: EnhancedStore;
    let form: BuyFormType;

    const initPreloadedStore = (firmwareType: FirmwareType) =>
        initStore({
            device: {
                selectedDevice: 'a',
                devices: [{ firmwareType, path: 'a' }],
            },
            wallet: { tradingNew: getInitializedTradingState() },
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

    describe('with regular firmware', () => {
        beforeEach(async () => {
            store = await initPreloadedStore(FirmwareType.Universal);
            form = await renderFormHook();
        });

        it('should render "Select coin" button with caret', async () => {
            const { getByLabelText } = await renderTradeableAssetPicker();

            expect(getByLabelText('Select coin')).toHaveTextContent(/^Select coin.$/);
        });

        it('should render bottom sheet with all assets', async () => {
            const { getByLabelText } = await renderTradeableAssetPicker();

            expect(getByLabelText('Bitcoin')).toBeTruthy();
            expect(getByLabelText('USDC')).toBeTruthy();
        });
    });

    describe('with BTC-only firmware', () => {
        beforeEach(async () => {
            store = await initPreloadedStore(FirmwareType.BitcoinOnly);
            form = await renderFormHook();
        });

        it('should preselect BTC and do not render caret', async () => {
            const { getByLabelText } = await renderTradeableAssetPicker();

            expect(getByLabelText('Select coin')).toHaveTextContent('BTC');
        });

        it('should not render bottom sheet at all', async () => {
            const { queryByLabelText } = await renderTradeableAssetPicker();

            expect(queryByLabelText('Bitcoin')).toBeNull();
        });

        it('should do nothing on button or input press', async () => {
            const { getByLabelText } = await renderTradeableAssetPicker();

            // no need to act as there should be no action
            fireEvent.press(getByLabelText('Select coin'));
            fireEvent.press(getByLabelText('You get'));

            expect(getByLabelText('Select coin')).toHaveTextContent('BTC');
        });
    });
});
