import { type TradingCountryOption } from '@suite-common/trading';
import { yup } from '@suite-common/validators';
import { events } from '@suite-native/analytics';
import { Form, useForm } from '@suite-native/forms';
import type { UseFormReturn } from '@suite-native/forms';
import { useAnalytics } from '@suite-native/services';
import { act, screen, userEvent } from '@suite-native/test-utils-store';
import {
    residenceCheckDisabledState,
    residenceCheckEnabledState,
} from '@suite-native/trading-fixtures';

import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    renderHookWithTradingProvider,
    renderWithTradingProvider,
} from '../../../__tests__/tradingTestUtils';
import { TradingCountryOfResidencePicker } from '../TradingCountryOfResidencePicker';

const reportMock = jest.fn();

jest.mock('@suite-native/services', () => {
    const original = jest.requireActual('@suite-native/services');

    return {
        ...original,
        useAnalytics: jest.fn(),
    };
});

describe('TradingCountryOfResidencePicker', () => {
    let form: UseFormReturn<{ country: TradingCountryOption }>;

    const renderForm = () =>
        renderHookWithTradingProvider(
            () => useForm<{ country: TradingCountryOption }>({ validation: yup.object() }),
            { overrides: residenceCheckDisabledState },
        );

    const renderCountryOfResidencePicker = (
        overrides: PreloadedStatePartial<TradingTestPreloadedState>,
    ) =>
        renderWithTradingProvider(
            <TradingCountryOfResidencePicker testID="testID" context="buy" />,
            {
                wrapper: ({ children }) => <Form form={form}>{children}</Form>,
                overrides,
            },
        );

    beforeEach(() => {
        jest.clearAllMocks();

        (useAnalytics as jest.Mock).mockReturnValue({
            report: reportMock,
        });

        const { result } = renderForm();
        form = result.current;
    });

    afterEach(() => {
        screen.unmount();
    });

    it('should use country from form', () => {
        act(() => {
            form.setValue('country', {
                value: 'US',
                label: '🇺🇸 United States',
                shortLabel: '🇺🇸 USA',
                codeAlpha3: 'USA',
                flag: '🇺🇸',
                name: 'United States',
            });
        });

        const { getByTestId } = renderCountryOfResidencePicker(residenceCheckDisabledState);

        expect(getByTestId('testID/value')).toHaveTextContent('USA');
    });

    it('should call analytics on country change', async () => {
        const { getByText } = renderCountryOfResidencePicker(residenceCheckDisabledState);

        await userEvent.press(getByText('Country of residence'));
        await userEvent.press(getByText(/Algeria/));

        expect(reportMock).toHaveBeenCalledWith({
            type: events.tradingParameterChangedEvent.name,
            payload: {
                type: 'buy',
                parameter: 'country',
            },
        });
    });

    it('should render nothing when isTradingResidenceCheckEnabled FF is true', () => {
        const { toJSON } = renderCountryOfResidencePicker(residenceCheckEnabledState);

        expect(toJSON()).toBeNull();
    });
});
