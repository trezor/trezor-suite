import { fireEvent, render } from '@suite-native/test-utils';

import { CountryOfResidencePicker } from '../CountryOfResidencePicker';

describe('CountryOfResidencePicker', () => {
    const renderReceiveAccountPicker = () => render(<CountryOfResidencePicker />);

    it('should display "Not selected" when in default state', () => {
        const { getByLabelText } = renderReceiveAccountPicker();

        expect(getByLabelText('No country of residence selected')).toHaveTextContent(
            'Not selected',
        );
    });

    it('should allow to select country', () => {
        const { getByText, getByLabelText } = renderReceiveAccountPicker();

        // select country
        fireEvent.press(getByText('Country of residence'));
        fireEvent.press(getByText(/Algeria/));

        expect(getByLabelText('Selected country of residence')).toHaveTextContent('🇩🇿 Algeria');
    });
});
