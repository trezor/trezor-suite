import { type TokenSymbol } from '@suite-common/wallet-types';
import { renderWithBasicProvider } from '@suite-native/test-utils';

import {
    CompactTokenAmountFormatter,
    type CompactTokenAmountFormatterProps,
} from './CompactTokenAmountFormatter';
import {
    ExactTokenAmountFormatter,
    type ExactTokenAmountFormatterProps,
} from './ExactTokenAmountFormatter';
import { asDecimalTokenAmount } from '../utils';

let mockIsDiscreetMode = false;

jest.mock('@suite-common/discreet-mode', () => ({
    useDiscreetMode: () => ({
        isDiscreetMode: mockIsDiscreetMode,
    }),
}));

beforeEach(() => {
    mockIsDiscreetMode = false;
});

// Both formatters expect `value` in human-readable units; base-unit amounts must be converted
// by the caller.
describe('ExactTokenAmountFormatter', () => {
    const renderExactTokenAmountFormatter = (props: Partial<ExactTokenAmountFormatterProps>) =>
        renderWithBasicProvider(
            <ExactTokenAmountFormatter
                tokenSymbol={'USDC' as TokenSymbol}
                value={asDecimalTokenAmount('1234.56')}
                {...props}
            />,
        );

    it('should render formatted value', async () => {
        const { getByTestId, getByText } = await renderExactTokenAmountFormatter({});

        expect(getByTestId('plain-text')).toHaveTextContent('1,234.56');
        expect(getByText('USDC')).toBeOnTheScreen();
    });

    it('hides the amount while keeping the token symbol visible in discreet mode', async () => {
        mockIsDiscreetMode = true;
        const { getByTestId, getByText } = await renderExactTokenAmountFormatter({});

        expect(getByTestId('discreet-text')).toHaveTextContent('1,234.56');
        expect(getByTestId('discreet-text')).not.toBeVisible();
        expect(getByText('USDC')).toBeVisible();
    });

    it('should cap displayed decimals to the token precision', async () => {
        const { getByTestId } = await renderExactTokenAmountFormatter({
            value: asDecimalTokenAmount('0.000000000000000001'),
            maxDisplayedDecimals: 18,
        });

        expect(getByTestId('plain-text')).toHaveTextContent('0.000000000000000001');
    });

    it('should render phishing transaction with empty value as discreet text', async () => {
        const { getByTestId, getByText } = await renderExactTokenAmountFormatter({
            value: asDecimalTokenAmount(''),
            isPhishingTransaction: true,
        });

        expect(getByTestId('discreet-text')).toHaveTextContent('0');
        expect(getByText('USDC')).toBeVisible();
    });
});

describe('CompactTokenAmountFormatter', () => {
    const renderCompactTokenAmountFormatter = (props: Partial<CompactTokenAmountFormatterProps>) =>
        renderWithBasicProvider(
            <CompactTokenAmountFormatter
                tokenSymbol={'USDC' as TokenSymbol}
                value={asDecimalTokenAmount('1234.56')}
                {...props}
            />,
        );

    it('should render compact formatted value', async () => {
        const { getByTestId } = await renderCompactTokenAmountFormatter({});

        expect(getByTestId('plain-text')).toHaveTextContent('1,234.56');
    });

    it('should render compact formatted dust value', async () => {
        const { getByTestId } = await renderCompactTokenAmountFormatter({
            value: asDecimalTokenAmount('0.000009'),
        });

        expect(getByTestId('plain-text')).toHaveTextContent('<0.00001');
    });

    it('should format a 6-decimal token balance money-like (two decimals)', async () => {
        const { getByTestId } = await renderCompactTokenAmountFormatter({
            tokenDecimals: 6,
            value: asDecimalTokenAmount('23.910287'),
        });

        expect(getByTestId('plain-text')).toHaveTextContent('23.91');
    });

    it('should apply the money dust threshold for 6-decimal tokens', async () => {
        const { getByTestId } = await renderCompactTokenAmountFormatter({
            tokenDecimals: 6,
            value: asDecimalTokenAmount('0.009'),
        });

        expect(getByTestId('plain-text')).toHaveTextContent('<0.01');
    });

    it('should not apply money formatting to non-6-decimal tokens', async () => {
        const { getByTestId } = await renderCompactTokenAmountFormatter({
            tokenDecimals: 18,
            value: asDecimalTokenAmount('0.009'),
        });

        expect(getByTestId('plain-text')).toHaveTextContent('0.009');
    });
});
