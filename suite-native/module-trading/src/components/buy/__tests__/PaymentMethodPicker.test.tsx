import { render } from '@suite-native/test-utils';

import { PaymentMethodPicker } from '../PaymentMethodPicker';

describe('PaymentMethodPicker', () => {
    it('should display "Not selected" when in default state', () => {
        const { getByText } = render(<PaymentMethodPicker />);
        expect(getByText('Not selected')).toBeDefined();
    });
});
