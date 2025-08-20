import { EventType, analytics } from '@suite-native/analytics';
import { Form } from '@suite-native/forms';
import {
    act,
    renderHookWithStoreProviderAsync,
    renderWithBasicProvider,
    userEvent,
} from '@suite-native/test-utils';

import { useBuyForm } from '../../../hooks/buy/useBuyForm';
import { BuyFormType } from '../../../types/buy';
import { BuyCountryOfResidencePicker } from '../BuyCountryOfResidencePicker';

describe('BuyCountryOfResidencePicker', () => {
    let form: BuyFormType;

    const renderBuyForm = () => renderHookWithStoreProviderAsync(() => useBuyForm());

    const renderCountryOfResidencePicker = () =>
        renderWithBasicProvider(<BuyCountryOfResidencePicker />, {
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
        });

    beforeEach(async () => {
        const { result } = await renderBuyForm();
        form = result.current;
    });

    it('should use selected country from form', () => {
        act(() => {
            form.setValue('country', { value: 'US', label: 'United States' });
        });

        const { getByTestId } = renderCountryOfResidencePicker();

        expect(getByTestId('@trading/buy/country/value')).toHaveTextContent('United States');
    });

    it('should call analytics on country change', async () => {
        const reportSpy = jest.spyOn(analytics, 'report');

        const { getByText } = renderCountryOfResidencePicker();

        await userEvent.press(getByText('Country of residence'));
        await userEvent.press(getByText(/Algeria/));

        expect(reportSpy).toHaveBeenCalledWith({
            type: EventType.TradingParameterChanged,
            payload: {
                type: 'buy',
                parameter: 'country',
            },
        });
    });
});
