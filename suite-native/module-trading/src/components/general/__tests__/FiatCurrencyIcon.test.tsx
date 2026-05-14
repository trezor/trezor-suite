import { renderWithBasicProvider } from '@suite-native/test-utils';

import { FiatCurrencyIcon } from '../FiatCurrencyIcon';

describe('FiatCurrencyIcon', () => {
    it('should render a mapped fiat currency flag', () => {
        const { getByLabelText, queryByText } = renderWithBasicProvider(
            <FiatCurrencyIcon size="medium" value="usd" />,
        );

        expect(getByLabelText('flag-US')).toBeTruthy();
        expect(queryByText('coin')).toBeNull();
    });

    it('should render fallback coin icon when fiat currency is missing', () => {
        const { queryByTestId } = renderWithBasicProvider(<FiatCurrencyIcon size="medium" />);

        expect(queryByTestId('@trading/fiat-currency-icon-fallback')).toBeTruthy();
        expect(queryByTestId('@atom/flag')).toBeNull();
    });
});
