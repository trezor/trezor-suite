import { IntlProvider } from 'react-intl';

import { renderWithBasicProvider } from '@suite-native/test-utils';

import { PercentageDifferenceFormatter } from './PercentageDifferenceFormatter';

describe('PercentageDifferenceFormatter', () => {
    it('shows a positive sign and percentage when price increases', async () => {
        const { getByTestId } = await renderWithBasicProvider(
            <PercentageDifferenceFormatter oldValue={1} newValue={11} testID="formatter" />,
        );

        expect(getByTestId('formatter')).toHaveTextContent('+1,000%');
    });

    it('shows a negative sign and percentage when price decreases', async () => {
        const { getByTestId } = await renderWithBasicProvider(
            <PercentageDifferenceFormatter oldValue={100} newValue={75} testID="formatter" />,
        );

        expect(getByTestId('formatter')).toHaveTextContent('-25%');
    });

    it('rounds the percentage to the nearest integer', async () => {
        const { getByTestId } = await renderWithBasicProvider(
            <PercentageDifferenceFormatter oldValue={300} newValue={301} testID="formatter" />,
        );

        expect(getByTestId('formatter')).toHaveTextContent('+0%');
    });

    it('formats percentage using the active intl locale', async () => {
        const { getByTestId } = await renderWithBasicProvider(
            <IntlProvider locale="cs">
                <PercentageDifferenceFormatter oldValue={1} newValue={11} testID="formatter" />
            </IntlProvider>,
        );

        expect(getByTestId('formatter')).toHaveTextContent('+1 000 %');
    });

    it('shows 0% when oldValue is 0', async () => {
        const { getByTestId } = await renderWithBasicProvider(
            <PercentageDifferenceFormatter oldValue={0} newValue={100} testID="formatter" />,
        );

        expect(getByTestId('formatter')).toHaveTextContent('+0%');
    });
});
