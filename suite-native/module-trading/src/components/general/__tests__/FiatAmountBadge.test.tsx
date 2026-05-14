import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { renderWithBasicProvider } from '@suite-native/test-utils';
import { BigNumber } from '@trezor/utils';

import { FiatAmountBadge, type FiatAmountBadgeProps } from '../FiatAmountBadge';

describe('FiatAmountBadge', () => {
    const renderFiatAmountBadge = (props: FiatAmountBadgeProps) =>
        renderWithBasicProvider(<FiatAmountBadge {...props} />);

    it('should display nothing when amount is not provided', () => {
        const { toJSON } = renderFiatAmountBadge({ amount: undefined });

        expect(toJSON()).toBeNull();
    });

    it('should display formatted value in app currency', () => {
        const { getByText } = renderFiatAmountBadge({
            amount: asBaseCurrencyAmount(new BigNumber('1234.56')),
        });

        expect(getByText('$1,234.56')).toBeDefined();
    });

    it('should display 0 value', () => {
        const { getByText } = renderFiatAmountBadge({
            amount: asBaseCurrencyAmount(new BigNumber('0')),
        });

        expect(getByText('$0.00')).toBeDefined();
    });

    it('should display nothing for empty string value', () => {
        const { toJSON } = renderFiatAmountBadge({
            amount: asBaseCurrencyAmount(new BigNumber('')),
        });

        expect(toJSON()).toBeNull();
    });
});
