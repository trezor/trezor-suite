import { renderWithBasicProvider } from '@suite-native/test-utils';

import { FiatAmountBadge, FiatAmountBadgeProps } from '../FiatAmountBadge';

describe('FiatAmountBadge', () => {
    const renderFiatAmountBadge = (props: FiatAmountBadgeProps) =>
        renderWithBasicProvider(<FiatAmountBadge {...props} />);

    it('should display nothing when amount is not provided', () => {
        const { toJSON } = renderFiatAmountBadge({ amount: undefined });

        expect(toJSON()).toBeNull();
    });

    it('should display formatted value in app currency', () => {
        const { getByText } = renderFiatAmountBadge({ amount: '1234.56' });

        expect(getByText('$1,234.56')).toBeDefined();
    });

    it('should display 0 value', () => {
        const { getByText } = renderFiatAmountBadge({ amount: '0' });

        expect(getByText('$0.00')).toBeDefined();
    });

    it('should display nothing for empty string value', () => {
        const { toJSON } = renderFiatAmountBadge({ amount: '' });

        expect(toJSON()).toBeNull();
    });
});
