import { Form } from '@suite-native/forms';
import {
    PreloadedState,
    act,
    renderHookWithStoreProviderAsync,
    renderWithBasicProvider,
} from '@suite-native/test-utils';

import { useBuyForm } from '../../../hooks/buy/useBuyForm';
import { BuyForm } from '../../../types/buy';
import { BuyFormFieldErrorBadge, BuyFormFieldErrorBadgeProps } from '../BuyFormFieldErrorBadge';

describe('BuyFormFieldErrorBadge', () => {
    let tradingForm: BuyForm;

    const renderUseBuyForm = async (preloadedState: PreloadedState = {}) => {
        const { result } = await renderHookWithStoreProviderAsync(() => useBuyForm(), {
            preloadedState,
        });

        return result.current;
    };

    const renderBuyFormFieldErrorBadge = (props: BuyFormFieldErrorBadgeProps, form: BuyForm) =>
        renderWithBasicProvider(
            <Form form={form}>
                <BuyFormFieldErrorBadge {...props} />
            </Form>,
        );

    beforeEach(async () => {
        tradingForm = await renderUseBuyForm();
    });

    it('should render nothing where there is no error in form', () => {
        const { toJSON } = renderBuyFormFieldErrorBadge({ fieldName: 'fiatValue' }, tradingForm);

        expect(toJSON()).toBeNull();
    });

    it('should render error when field has error', () => {
        act(() => {
            tradingForm.setError('fiatValue', {
                type: 'manual',
                message: 'Error message',
            });
        });
        const { getByText } = renderBuyFormFieldErrorBadge({ fieldName: 'fiatValue' }, tradingForm);

        expect(getByText('Error message')).toBeTruthy();
    });
});
