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

import { useSellForm } from '../../../../hooks/sell/useSellForm';
import { SellFormType } from '../../../../types/sell';
import { SellCountryOfResidencePicker } from '../SellCountryOfResidencePicker';

describe('SellCountryOfResidencePicker', () => {
    let form: SellFormType;

    const renderSellForm = () => renderHookWithStoreProviderAsync(() => useSellForm());

    const renderCountryOfResidencePicker = (preloadedState: PreloadedState) =>
        renderWithStoreProviderAsync(<SellCountryOfResidencePicker />, {
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
            preloadedState,
        });

    beforeEach(async () => {
        const { result } = await renderSellForm();
        form = result.current;
    });

    it('should use selected country from form', async () => {
        act(() => {
            form.setValue('country', { value: 'US', label: 'United States' });
        });

        const { getByTestId } = await renderCountryOfResidencePicker({});

        expect(getByTestId('@trading/sell/country/value')).toHaveTextContent('United States');
    });

    it('should call analytics on country change', async () => {
        const reportSpy = jest.spyOn(analytics, 'report');

        const { getByText } = await renderCountryOfResidencePicker({});

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

    it('should render nothing when isTradingResidenceCheckEnabled FF is true', async () => {
        const { toJSON } = await renderCountryOfResidencePicker({
            featureFlags: { [FeatureFlag.IsTradingResidenceCheckEnabled]: true },
        });

        expect(toJSON()).toBeNull();
    });
});
