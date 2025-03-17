import {
    fireEvent,
    renderHookWithStoreProviderAsync,
    renderWithBasicProvider,
} from '@suite-native/test-utils';

import { useTradingBuyForm } from '../../../hooks/useTradingBuyForm';
import { CountryOfResidencePicker } from '../CountryOfResidencePicker';

describe('CountryOfResidencePicker', () => {
    const renderCountryOfResidencePicker = async () => {
        const { result } = await renderHookWithStoreProviderAsync(() => useTradingBuyForm());

        return renderWithBasicProvider(<CountryOfResidencePicker form={result.current} />);
    };

    it('should display "Not selected" when in default state', async () => {
        const { getByLabelText } = await renderCountryOfResidencePicker();

        expect(getByLabelText('No country of residence selected')).toHaveTextContent(
            'Not selected',
        );
    });

    it('should allow to select country', async () => {
        const { getByText, getByLabelText } = await renderCountryOfResidencePicker();

        // select country
        fireEvent.press(getByText('Country of residence'));
        fireEvent.press(getByText(/Algeria/));

        expect(getByLabelText('Selected country of residence')).toHaveTextContent('🇩🇿 Algeria');
    });
});
