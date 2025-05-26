import { Form } from '@suite-native/forms';
import {
    PreloadedState,
    act,
    renderHookWithStoreProviderAsync,
    renderWithStoreProviderAsync,
} from '@suite-native/test-utils';

import { useTradingBuyForm } from '../../../hooks/useTradingBuyForm';
import { TradingBuyForm } from '../../../types';
import { BuyFormFieldErrorBadge, BuyFormFieldErrorBadgeProps } from '../BuyFormFieldErrorBadge';

describe('BuyFormFieldErrorBadge', () => {
    let tradingForm: TradingBuyForm;

    const renderUseTradingBuyForm = async (preloadedState: PreloadedState = {}) => {
        const { result } = await renderHookWithStoreProviderAsync(() => useTradingBuyForm(), {
            preloadedState,
        });

        return result.current;
    };

    const renderBuyFormFieldErrorBadge = (
        props: BuyFormFieldErrorBadgeProps,
        form: TradingBuyForm,
    ) =>
        renderWithStoreProviderAsync(
            <Form form={form}>
                <BuyFormFieldErrorBadge {...props} />
            </Form>,
        );

    beforeEach(async () => {
        tradingForm = await renderUseTradingBuyForm();
    });

    it('should render nothing where there is no error in form', async () => {
        const { toJSON } = await renderBuyFormFieldErrorBadge(
            { fieldName: 'fiatValue' },
            tradingForm,
        );

        expect(toJSON()).toBeNull();
    });

    it('should render error when field has error', async () => {
        act(() => {
            tradingForm.setError('fiatValue', {
                type: 'manual',
                message: 'Error message',
            });
        });
        const { getByText } = await renderBuyFormFieldErrorBadge(
            { fieldName: 'fiatValue' },
            tradingForm,
        );

        expect(getByText('Error message')).toBeTruthy();
    });
});
