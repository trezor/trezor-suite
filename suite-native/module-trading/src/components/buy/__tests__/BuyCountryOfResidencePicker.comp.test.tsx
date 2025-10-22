import { EventType, analytics } from '@suite-native/analytics';
import { FeatureFlag } from '@suite-native/feature-flags';
import { Form } from '@suite-native/forms';
import {
    PreloadedState,
    act,
    renderHookWithStoreProviderAsync,
    renderWithStoreProviderAsync,
    userEvent,
} from '@suite-native/test-utils';

import { useBuyForm } from '../../../hooks/buy/useBuyForm';
import { BuyFormType } from '../../../types/buy';
import { BuyCountryOfResidencePicker } from '../BuyCountryOfResidencePicker';

describe('BuyCountryOfResidencePicker', () => {
    let form: BuyFormType;

    const renderBuyForm = () => renderHookWithStoreProviderAsync(() => useBuyForm());

    const renderCountryOfResidencePicker = (preloadedState: PreloadedState) =>
        renderWithStoreProviderAsync(<BuyCountryOfResidencePicker />, {
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
            preloadedState,
        });

    beforeEach(async () => {
        const { result } = await renderBuyForm();
        form = result.current;
    });

    it('should use selected country from form', async () => {
        act(() => {
            form.setValue('country', { value: 'US', label: 'United States' });
        });

        const { getByTestId } = await renderCountryOfResidencePicker({});

        expect(getByTestId('@trading/buy/country/value')).toHaveTextContent('United States');
    });

    it('should call analytics on country change', async () => {
        const reportSpy = jest.spyOn(analytics, 'report');

        const { getByText } = await renderCountryOfResidencePicker({});

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
        const { toJSON } = await renderCountryOfResidencePicker({
            featureFlags: { [FeatureFlag.IsTradingResidenceCheckEnabled]: true },
        });

        expect(toJSON()).toBeNull();
    });
});
