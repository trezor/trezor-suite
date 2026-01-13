import { TradingCountryOption } from '@suite-common/trading';
import { yup } from '@suite-common/validators';
import { EventType, analytics } from '@suite-native/analytics';
import { Form, useForm } from '@suite-native/forms';
import type { UseFormReturn } from '@suite-native/forms';
import {
    PreloadedState,
    act,
    renderHookWithStoreProviderAsync,
    renderWithStoreProviderAsync,
    screen,
    userEvent,
} from '@suite-native/test-utils';
import {
    residenceCheckDisabledState,
    residenceCheckEnabledState,
} from '@suite-native/trading-fixtures';

import { TradingCountryOfResidencePicker } from '../TradingCountryOfResidencePicker';

describe('TradingCountryOfResidencePicker', () => {
    let form: UseFormReturn<{ country: TradingCountryOption }>;

    const renderForm = () =>
        renderHookWithStoreProviderAsync(
            () => useForm<{ country: TradingCountryOption }>({ validation: yup.object() }),
            { preloadedState: residenceCheckDisabledState },
        );

    const renderCountryOfResidencePicker = (preloadedState: PreloadedState) =>
        renderWithStoreProviderAsync(
            <TradingCountryOfResidencePicker testID="testID" context="buy" />,
            {
                wrapper: ({ children }) => <Form form={form}>{children}</Form>,
                preloadedState,
            },
        );

    beforeEach(async () => {
        const { result } = await renderForm();
        form = result.current;
    });

    afterEach(() => {
        screen.unmount();
    });

    it('should use country from form', async () => {
        act(() => {
            form.setValue('country', { value: 'US', label: 'United States' });
        });

        const { getByTestId } = await renderCountryOfResidencePicker(residenceCheckDisabledState);

        expect(getByTestId('testID/value')).toHaveTextContent('United States');
    });

    it('should call analytics on country change', async () => {
        const reportSpy = jest.spyOn(analytics, 'report');

        const { getByText } = await renderCountryOfResidencePicker(residenceCheckDisabledState);

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

    it('should render nothing when isTradingResidenceCheckEnabled FF is true', async () => {
        const { toJSON } = await renderCountryOfResidencePicker(residenceCheckEnabledState);

        expect(toJSON()).toBeNull();
    });
});
