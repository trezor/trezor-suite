import { EventType, analytics } from '@suite-native/analytics';
import { Form } from '@suite-native/forms';
import {
    act,
    renderHookWithStoreProviderAsync,
    renderWithBasicProvider,
    userEvent,
} from '@suite-native/test-utils';

import { useSellForm } from '../../../../hooks/sell/useSellForm';
import { SellFormType } from '../../../../types/sell';
import { SellCountryOfResidencePicker } from '../SellCountryOfResidencePicker';

describe('SellCountryOfResidencePicker', () => {
    let form: SellFormType;

    const renderSellForm = () => renderHookWithStoreProviderAsync(() => useSellForm());

    const renderCountryOfResidencePicker = () =>
        renderWithBasicProvider(<SellCountryOfResidencePicker />, {
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
        });

    beforeEach(async () => {
        const { result } = await renderSellForm();
        form = result.current;
    });

    it('should use selected country from form', () => {
        act(() => {
            form.setValue('country', { value: 'US', label: 'United States' });
        });

        const { getByTestId } = renderCountryOfResidencePicker();

        expect(getByTestId('@trading/sell/country/value')).toHaveTextContent('United States');
    });

    it('should call analytics on country change', async () => {
        const reportSpy = jest.spyOn(analytics, 'report');

        const { getByText } = renderCountryOfResidencePicker();

        await userEvent.press(getByText('Country of residence'));
        await userEvent.press(getByText(/Algeria/));

        expect(reportSpy).toHaveBeenCalledWith({
            type: EventType.TradingParameterChanged,
            payload: {
                type: 'sell',
                parameter: 'country',
            },
        });
    });
});
