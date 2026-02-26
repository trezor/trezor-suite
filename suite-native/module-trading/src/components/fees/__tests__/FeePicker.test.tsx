import React from 'react';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { userEvent } from '@suite-native/test-utils';
// eslint-disable-next-line local-rules/no-package-deep-imports
import { renderWithStoreProviderAsync } from '@suite-native/test-utils/store';

import { FEE_PICKER_TEST_ID, FeePicker } from '../FeePicker';

const rateObject = { rate: 50000, error: null };

// Mock the selectors used by CryptoToFiatAmountFormatter
jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    selectBaseCurrency: jest.fn(() => 'usd'),
    selectFiatRatesByFiatRateKey: jest.fn(() => rateObject),
}));

describe('FeePicker', () => {
    const defaultProps = {
        fee: '1000',
        symbol: 'btc' as NetworkSymbol,
        onPress: jest.fn(),
    };

    const renderFeePicker = async (props = {}) => {
        const finalProps = { ...defaultProps, ...props };

        return await renderWithStoreProviderAsync(<FeePicker {...finalProps} />);
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render fee label', async () => {
        const { getByText } = await renderFeePicker();

        expect(getByText('Fee')).toBeTruthy();
    });

    it('should render fee value with correct symbol', async () => {
        const { getByText } = await renderFeePicker({
            fee: '5000',
            symbol: 'eth' as NetworkSymbol,
            isLoading: false,
        });

        // Should show the formatted fee value
        expect(getByText('$0.00')).toBeTruthy();
    });

    it('should render caret right icon', async () => {
        const { getByTestId } = await renderFeePicker();

        const icon = getByTestId('caret-right-icon');
        expect(icon).toBeTruthy();
    });

    it('should render clickable component', async () => {
        const mockOnPress = jest.fn();
        const { getByTestId } = await renderFeePicker({
            onPress: mockOnPress,
            isLoading: false,
        });

        await userEvent.press(getByTestId(FEE_PICKER_TEST_ID));

        expect(mockOnPress).toHaveBeenCalledTimes(1);
    });

    it('should show loading state when isLoading is true', async () => {
        const { getByTestId } = await renderFeePicker({ isLoading: true });

        // When loading, should show skeleton
        const skeleton = getByTestId('BoxSkeleton');
        expect(skeleton).toBeTruthy();
    });

    it('should not show loading state when isLoading is false', async () => {
        const { getByText } = await renderFeePicker({ isLoading: false });

        // When not loading, should show the formatted fee value
        expect(getByText('$0.50')).toBeTruthy();
    });

    it('should not show loading state when isLoading is undefined', async () => {
        const { getByText } = await renderFeePicker();

        // When isLoading is undefined, should show the formatted fee value
        expect(getByText('$0.50')).toBeTruthy();
    });

    it.each(['btc', 'eth', 'ltc', 'bch', 'doge'])(
        'should render with %s network symbol',
        async symbol => {
            const { getByText } = await renderFeePicker({
                symbol: symbol as NetworkSymbol,
                isLoading: false,
            });
            // Each symbol should show a formatted value
            expect(getByText(/\$\d+\.\d{2}/)).toBeTruthy();
        },
    );

    it.each(['100', '1000', '10000', '0.001', '0.00000001'])(
        'should render with fee value %s',
        async fee => {
            const { getByText } = await renderFeePicker({
                fee,
                isLoading: false,
            });
            // Each fee should be formatted and displayed
            expect(getByText(/\$\d+\.\d{2}/)).toBeTruthy();
        },
    );

    it('should render the approximate symbol', async () => {
        const { getByText } = await renderFeePicker();

        expect(getByText('≈')).toBeTruthy();
    });
});
