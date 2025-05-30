import { Form } from '@suite-native/forms';
import {
    act,
    renderHookWithStoreProviderAsync,
    renderWithBasicProvider,
} from '@suite-native/test-utils';

import { useBuyForm } from '../../../hooks/buy/useBuyForm';
import { BuyFormType } from '../../../types/buy';
import { BuyAlert } from '../BuyAlert';

describe('BuyAlert', () => {
    let form: BuyFormType;

    const renderFormHook = () => renderHookWithStoreProviderAsync(() => useBuyForm());

    const renderTradingAlert = () =>
        renderWithBasicProvider(
            <Form form={form}>
                <BuyAlert />
            </Form>,
        );

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
