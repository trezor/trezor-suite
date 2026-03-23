import { type EnhancedStore } from '@reduxjs/toolkit';

import { Form } from '@suite-native/forms';
import {
    initStore,
    renderHookWithStoreProvider,
    renderWithStoreProvider,
    screen,
} from '@suite-native/test-utils';
import { getInitializedTradingState } from '@suite-native/trading-fixtures';
import { type ExchangeFormType } from '@suite-native/trading-types';
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

    const renderFormHook = () => {
        const { result } = renderHookWithStoreProvider(() => useExchangeForm(), {
            store,
        });

        return result.current;
    };

    const renderTradeableAssetPicker = () =>
        renderWithStoreProvider(<ExchangeTradeableAssetPicker />, {
            store,
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
        });

    beforeEach(() => {
        store = initPreloadedStore(FirmwareType.Universal).store;
        form = renderFormHook();
    });

    afterEach(() => {
        screen.unmount();
    });

    it('should render "Select asset" button with caret', () => {
        const { getByLabelText } = renderTradeableAssetPicker();

        expect(getByLabelText('Select asset')).toHaveTextContent(/^Select asset.$/);
    });

    it('should render bottom sheet with all assets', () => {
        const { getAllByText } = renderTradeableAssetPicker();

        expect(getAllByText('Bitcoin')).toBeTruthy();
        expect(getAllByText('USDC')).toBeTruthy();
    });
});
