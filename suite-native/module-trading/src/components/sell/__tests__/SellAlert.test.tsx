import { Form } from '@suite-native/forms';
import { renderWithBasicProvider } from '@suite-native/test-utils';
import { act, renderHookWithStoreProvider } from '@suite-native/test-utils-store';
import { type SellFormType } from '@suite-native/trading-types';

import { useSellForm } from '../../../hooks/sell/useSellForm';
import { SellAlert } from '../SellAlert';

describe('SellAlert', () => {
    let form: SellFormType;

    const renderFormHook = () => renderHookWithStoreProvider(() => useSellForm());

    const renderTradingAlert = () =>
        renderWithBasicProvider(<SellAlert />, {
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
