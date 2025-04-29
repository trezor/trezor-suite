import { EnhancedStore } from '@reduxjs/toolkit';

import { Form } from '@suite-native/forms';
import {
    fireEvent,
    initStore,
    renderHookWithStoreProviderAsync,
    renderWithStoreProviderAsync,
    within,
} from '@suite-native/test-utils';
import { FirmwareType } from '@trezor/connect';

import { getInitializedTradingState } from '../../../__fixtures__/tradingState';
import { useTradingBuyForm } from '../../../hooks/useTradingBuyForm';
import { TradingBuyForm } from '../../../types';
import { TradeableAssetPicker } from '../TradeableAssetPicker';

describe('TradeableAssetPicker', () => {
    let store: EnhancedStore;
    let form: TradingBuyForm;

    const initPreloadedStore = (firmwareType: FirmwareType) =>
        initStore({
            device: { selectedDevice: { firmwareType } },
            wallet: { tradingNew: getInitializedTradingState() },
        });

    const renderFormHook = async () => {
        const { result } = await renderHookWithStoreProviderAsync(() => useTradingBuyForm(), {
            store,
        });

        return result.current;
    };

    const renderTradeableAssetPicker = () =>
        renderWithStoreProviderAsync(
            <Form form={form}>
                <TradeableAssetPicker />
            </Form>,
            { store },
        );

    describe('with regular firmware', () => {
        beforeEach(async () => {
            store = await initPreloadedStore(FirmwareType.Regular);
            form = await renderFormHook();
        });

        it('should render "Select coin" button with caret', async () => {
            const { getByLabelText } = await renderTradeableAssetPicker();

            expect(getByLabelText('Select coin')).toHaveTextContent(/^Select coin.$/);
        });

        it('should render bottom sheet with all assets', async () => {
            const { getByLabelText } = await renderTradeableAssetPicker();

            expect(
                within(getByLabelText('Bitcoin')).getByLabelText('Coin symbol'),
            ).toHaveTextContent('BTC');
            expect(within(getByLabelText('USDC')).getByLabelText('Coin symbol')).toHaveTextContent(
                'USDC',
            );
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
