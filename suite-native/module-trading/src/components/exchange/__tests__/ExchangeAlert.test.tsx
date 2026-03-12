import { Form } from '@suite-native/forms';
import { act, renderWithBasicProvider } from '@suite-native/test-utils';
import { renderHookWithStoreProviderAsync } from '@suite-native/test-utils/store';
import { ExchangeFormType } from '@suite-native/trading-types';

import { useExchangeForm } from '../../../hooks/exchange/useExchangeForm';
import { ExchangeAlert } from '../ExchangeAlert';

describe('ExchangeAlert', () => {
    let form: ExchangeFormType;

    const renderFormHook = () => renderHookWithStoreProviderAsync(() => useExchangeForm());

    const renderTradingAlert = () =>
        renderWithBasicProvider(<ExchangeAlert />, {
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
        });

    beforeEach(async () => {
        const { result } = await renderFormHook();
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
