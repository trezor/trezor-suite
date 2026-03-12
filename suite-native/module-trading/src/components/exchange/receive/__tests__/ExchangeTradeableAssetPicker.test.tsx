import { EnhancedStore } from '@reduxjs/toolkit';

import { Form } from '@suite-native/forms';
import { screen } from '@suite-native/test-utils';
import { initStore, renderHookWithStoreProviderAsync, renderWithStoreProviderAsync } from '@suite-native/test-utils/store';
import { getInitializedTradingState } from '@suite-native/trading-fixtures';
import { ExchangeFormType } from '@suite-native/trading-types';
import { FirmwareType } from '@trezor/connect';

import { useExchangeForm } from '../../../../hooks/exchange/useExchangeForm';
import { ExchangeTradeableAssetPicker } from '../ExchangeTradeableAssetPicker';

describe('ExchangeTradeableAssetPicker', () => {
    let store: EnhancedStore;
    let form: ExchangeFormType;

    const initPreloadedStore = (firmwareType: FirmwareType) =>
        initStore({
            device: { selectedDevice: { firmwareType } },
            wallet: { trading: getInitializedTradingState() },
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
        store = (await initPreloadedStore(FirmwareType.Universal)).store;
        form = await renderFormHook();
    });

    afterEach(() => {
        screen.unmount();
    });

    it('should render "Select asset" button with caret', async () => {
        const { getByLabelText } = await renderTradeableAssetPicker();

        expect(getByLabelText('Select asset')).toHaveTextContent(/^Select asset.$/);
    });

    it('should render bottom sheet with all assets', async () => {
        const { getAllByText } = await renderTradeableAssetPicker();

        expect(getAllByText('Bitcoin')).toBeTruthy();
        expect(getAllByText('USDC')).toBeTruthy();
    });
});
