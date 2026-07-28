import { IntlProvider } from 'react-intl';

import { renderWithBasicProvider } from '@suite-native/test-utils';

import { PercentageDifferenceFormatter } from './PercentageDifferenceFormatter';

describe('PercentageDifferenceFormatter', () => {
    it('shows a positive sign and percentage when price increases', () => {
        const { getByTestId } = renderWithBasicProvider(
            <PercentageDifferenceFormatter oldValue={1} newValue={11} testID="formatter" />,
        );

        expect(getByTestId('formatter')).toHaveTextContent('+1,000%');
    });

    it('shows a negative sign and percentage when price decreases', () => {
        const { getByTestId } = renderWithBasicProvider(
            <PercentageDifferenceFormatter oldValue={100} newValue={75} testID="formatter" />,
        );

        expect(getByTestId('formatter')).toHaveTextContent('-25%');
    });

    it('rounds the percentage to the nearest integer', () => {
        const { getByTestId } = renderWithBasicProvider(
            <PercentageDifferenceFormatter oldValue={300} newValue={301} testID="formatter" />,
        );

        expect(getByTestId('formatter')).toHaveTextContent('+0%');
    });

    it('formats percentage using the active intl locale', () => {
        const { getByTestId } = renderWithBasicProvider(
            <IntlProvider locale="cs">
                <PercentageDifferenceFormatter oldValue={1} newValue={11} testID="formatter" />
            </IntlProvider>,
        );

        expect(getByTestId('formatter')).toHaveTextContent('+1 000 %');
    });

    it('shows 0% when oldValue is 0', () => {
        const { getByTestId } = renderWithBasicProvider(
            <PercentageDifferenceFormatter oldValue={0} newValue={100} testID="formatter" />,
        );

        expect(getByTestId('formatter')).toHaveTextContent('+0%');
    });
});
