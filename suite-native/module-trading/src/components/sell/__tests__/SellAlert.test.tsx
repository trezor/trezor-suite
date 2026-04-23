import { Form } from '@suite-native/forms';
import { renderWithProviders } from '@suite-native/test-utils';
import { act, renderHookWithStoreProvider } from '@suite-native/test-utils-store';
import { getWalletState } from '@suite-native/trading-fixtures';
import { type SellFormType } from '@suite-native/trading-types';

import { useSellForm } from '../../../hooks/sell/useSellForm';
import { SellAlert } from '../SellAlert';

describe('SellAlert', () => {
    let form: SellFormType;
    const preloadedState = { wallet: getWalletState({ tradeType: 'sell' }) };

    const renderFormHook = () =>
        renderHookWithStoreProvider(() => useSellForm(), {
            preloadedState,
            providers: ['intl', 'navigation'],
        });

    const renderTradingAlert = () =>
        renderWithProviders(<SellAlert />, {
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
