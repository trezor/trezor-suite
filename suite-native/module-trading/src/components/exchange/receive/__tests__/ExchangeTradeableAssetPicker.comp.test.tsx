import { EnhancedStore } from '@reduxjs/toolkit';

import { Form } from '@suite-native/forms';
import {
    initStore,
    renderHookWithStoreProviderAsync,
    renderWithStoreProviderAsync,
} from '@suite-native/test-utils';
import { FirmwareType } from '@trezor/connect';

import { getInitializedTradingState } from '../../../../__fixtures__/tradingState';
import { useExchangeForm } from '../../../../hooks/exchange/useExchangeForm';
import { ExchangeFormType } from '../../../../types/exchange';
import { ExchangeTradeableAssetPicker } from '../ExchangeTradeableAssetPicker';

describe('ExchangeTradeableAssetPicker', () => {
    let store: EnhancedStore;
    let form: ExchangeFormType;

    const initPreloadedStore = (firmwareType: FirmwareType) =>
        initStore({
            device: { devices: [{ firmwareType, path: 'a' }], selectedDevice: 'a' },
            wallet: { tradingNew: getInitializedTradingState() },
        });

    const renderFormHook = async () => {
        const { result } = await renderHookWithStoreProviderAsync(() => useExchangeForm(), {
            store,
        });

        return result.current;
    };

    const renderTradeableAssetPicker = () =>
        renderWithStoreProviderAsync(<ExchangeTradeableAssetPicker />, {
            store,
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
        });

    beforeEach(async () => {
        store = await initPreloadedStore(FirmwareType.Universal);
        form = await renderFormHook();
    });

    it('should render "Select coin" button with caret', async () => {
        const { getByLabelText } = await renderTradeableAssetPicker();

        expect(getByLabelText('Select coin')).toHaveTextContent(/^Select coin.$/);
    });

    it('should render bottom sheet with all assets', async () => {
        const { getAllByText } = await renderTradeableAssetPicker();

        expect(getAllByText('Bitcoin')).toBeTruthy();
        expect(getAllByText('USDC')).toBeTruthy();
    });
});
