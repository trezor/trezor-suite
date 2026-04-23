import { FeatureFlag, featureFlagsInitialState } from '@suite-native/feature-flags';
import { Form } from '@suite-native/forms';
import { type TestStore, screen } from '@suite-native/test-utils-store';
import { type ExchangeFormType } from '@suite-native/trading-types';
import { FirmwareType } from '@trezor/connect';

import {
    createTradingLightStore,
    renderHookWithTradingProvider,
    renderWithTradingProvider,
} from '../../../../__tests__/tradingTestUtils';
import { useExchangeForm } from '../../../../hooks/exchange/useExchangeForm';
import { ExchangeTradeableAssetPicker } from '../ExchangeTradeableAssetPicker';

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
                    [FeatureFlag.AreTradingExchangeDexesEnabled]: true,
                },
            },
        });

    const renderFormHook = () => {
        const { result } = renderHookWithTradingProvider(() => useExchangeForm(), {
            store,
            providers: ['intl', 'navigation'],
        });

        return result.current;
    };

    const renderTradeableAssetPicker = () =>
        renderWithTradingProvider(<ExchangeTradeableAssetPicker />, {
            store,
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
            providers: ['intl', 'bottomSheet', 'navigation'],
        });

    beforeEach(() => {
        store = initPreloadedStore(FirmwareType.Universal);
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
