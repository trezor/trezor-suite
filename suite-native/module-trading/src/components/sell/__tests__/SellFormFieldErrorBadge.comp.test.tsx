import { Form } from '@suite-native/forms';
import {
    PreloadedState,
    act,
    renderHookWithStoreProviderAsync,
    renderWithStoreProviderAsync,
} from '@suite-native/test-utils';

import { useSellForm } from '../../../hooks/sell/useSellForm';
import { SellFormType } from '../../../types/sell';
import { SellFormFieldErrorBadge, SellFormFieldErrorBadgeProps } from '../SellFormFieldErrorBadge';

describe('SellFormFieldErrorBadge', () => {
    let tradingForm: SellFormType;

    const renderUseTradingSellForm = async (preloadedState: PreloadedState = {}) => {
        const { result } = await renderHookWithStoreProviderAsync(() => useSellForm(), {
            preloadedState,
        });

        return result.current;
    };

    const renderSellFormFieldErrorBadge = (
        props: SellFormFieldErrorBadgeProps,
        form: SellFormType,
        preloadedState: PreloadedState = {},
    ) =>
        renderWithStoreProviderAsync(
            <Form form={form}>
                <SellFormFieldErrorBadge {...props} />
            </Form>,
            { preloadedState },
        );

    beforeEach(async () => {
        tradingForm = await renderUseTradingSellForm();
    });

    it('should render nothing where there is no error in form', async () => {
        const { toJSON } = await renderSellFormFieldErrorBadge(
            { fieldName: 'fiatStringAmount' },
            tradingForm,
        );

        expect(toJSON()).toBeNull();
    });

    it('should render error when field has error', async () => {
        act(() => {
            tradingForm.setError('fiatStringAmount', {
                type: 'manual',
                message: 'Error message',
            });
        });
        const { getByText } = await renderSellFormFieldErrorBadge(
            { fieldName: 'fiatStringAmount' },
            tradingForm,
        );

        expect(getByText('Error message')).toBeTruthy();
    });
});
