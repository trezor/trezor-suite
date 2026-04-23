import { FeatureFlag, featureFlagsInitialState } from '@suite-native/feature-flags';
import { Form } from '@suite-native/forms';
import { renderWithProviders } from '@suite-native/test-utils';
import { act, renderHookWithStoreProvider } from '@suite-native/test-utils-store';
import { getWalletState } from '@suite-native/trading-fixtures';
import { type ExchangeFormType } from '@suite-native/trading-types';

import { useExchangeForm } from '../../../hooks/exchange/useExchangeForm';
import { ExchangeAlert } from '../ExchangeAlert';

describe('ExchangeAlert', () => {
    let form: ExchangeFormType;
    const preloadedState = {
        featureFlags: {
            ...featureFlagsInitialState,
            [FeatureFlag.AreTradingExchangeDexesEnabled]: true,
            [FeatureFlag.IsTradingResidenceCheckEnabled]: false,
        },
        wallet: getWalletState({ tradeType: 'exchange' }),
    };

    const renderFormHook = () =>
        renderHookWithStoreProvider(() => useExchangeForm(), {
            preloadedState,
            providers: ['intl', 'navigation'],
        });

    const renderTradingAlert = () =>
        renderWithProviders(<ExchangeAlert />, {
            providers: ['intl', 'navigation'],
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
        });

    beforeEach(() => {
        const { result } = renderFormHook();
        form = result.current;
    });

    it('should render alert based on form generalAlert value', () => {
        act(() => {
            form.setValue('generalAlert', 'TEST');
        });

        const { getByText } = renderTradingAlert();

        expect(getByText('TEST')).toBeTruthy();
    });

    it.each([undefined, ''])('should render nothing when generalAlert is %s', generalAlertValue => {
        act(() => {
            form.setValue('generalAlert', generalAlertValue);
        });

        const { toJSON } = renderTradingAlert();

        expect(toJSON()).toBeNull();
    });
});
