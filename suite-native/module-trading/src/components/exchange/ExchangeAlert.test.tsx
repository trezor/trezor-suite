import { deviceInitialState } from '@suite-common/device';
import { FeatureFlag, featureFlagsInitialState } from '@suite-native/feature-flags';
import { Form } from '@suite-native/forms';
import { renderWithBasicProvider } from '@suite-native/test-utils';
import { act, renderHookWithStoreProvider } from '@suite-native/test-utils-store';
import { getWalletState } from '@suite-native/trading-fixtures';
import { type ExchangeFormType } from '@suite-native/trading-types';

import { ExchangeAlert } from './ExchangeAlert';
import { useExchangeForm } from '../../hooks/exchange/useExchangeForm';

describe('ExchangeAlert', () => {
    let form: ExchangeFormType;
    const preloadedState = {
        device: deviceInitialState,
        featureFlags: {
            ...featureFlagsInitialState,
            [FeatureFlag.IsTradingResidenceCheckEnabled]: false,
        },
        wallet: getWalletState({ tradeType: 'exchange' }),
    };

    const renderFormHook = async () =>
        await renderHookWithStoreProvider(() => useExchangeForm(), {
            preloadedState,
        });

    const renderTradingAlert = async () =>
        await renderWithBasicProvider(<ExchangeAlert />, {
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
        });

    beforeEach(async () => {
        const { result } = await renderFormHook();
        form = result.current;
    });

    it('should render alert based on form generalAlert value', async () => {
        await act(() => {
            form.setValue('generalAlert', 'TEST');
        });

        const { getByText } = await renderTradingAlert();

        expect(getByText('TEST')).toBeTruthy();
    });

    it.each([undefined, ''])(
        'should render nothing when generalAlert is %s',
        async generalAlertValue => {
            await act(() => {
                form.setValue('generalAlert', generalAlertValue);
            });

            const { toJSON } = await renderTradingAlert();

            expect(toJSON()).toBeNull();
        },
    );
});
