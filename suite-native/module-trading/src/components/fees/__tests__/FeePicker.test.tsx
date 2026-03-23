import React from 'react';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { renderWithStoreProvider, userEvent } from '@suite-native/test-utils';

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

    const renderFeePicker = (props = {}) => {
        const finalProps = { ...defaultProps, ...props };

        return renderWithStoreProvider(<FeePicker {...finalProps} />);
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render fee label', () => {
        const { getByText } = renderFeePicker();

        expect(getByText('Fee')).toBeTruthy();
    });

    it('should render fee value with correct symbol', () => {
        const { getByText } = renderFeePicker({
            fee: '5000',
            symbol: 'eth' as NetworkSymbol,
            isLoading: false,
        });

        // Should show the formatted fee value
        expect(getByText('$0.00')).toBeTruthy();
    });

    it('should render caret right icon', () => {
        const { getByTestId } = renderFeePicker();

        const icon = getByTestId('caret-right-icon');
        expect(icon).toBeTruthy();
    });

    it('should render clickable component', async () => {
        const mockOnPress = jest.fn();
        const { getByTestId } = renderFeePicker({
            onPress: mockOnPress,
            isLoading: false,
        });

        await userEvent.press(getByTestId(FEE_PICKER_TEST_ID));

        expect(mockOnPress).toHaveBeenCalledTimes(1);
    });

    it('should show loading state when isLoading is true', () => {
        const { getByTestId } = renderFeePicker({ isLoading: true });

        // When loading, should show skeleton
        const skeleton = getByTestId('BoxSkeleton');
        expect(skeleton).toBeTruthy();
    });

    it('should not show loading state when isLoading is false', () => {
        const { getByText } = renderFeePicker({ isLoading: false });

        // When not loading, should show the formatted fee value
        expect(getByText('$0.50')).toBeTruthy();
    });

    it('should not show loading state when isLoading is undefined', () => {
        const { getByText } = renderFeePicker();

        // When isLoading is undefined, should show the formatted fee value
        expect(getByText('$0.50')).toBeTruthy();
    });

    it.each(['btc', 'eth', 'ltc', 'bch', 'doge'])(
        'should render with %s network symbol',
        symbol => {
            const { getByText } = renderFeePicker({
                symbol: symbol as NetworkSymbol,
                isLoading: false,
            });
            // Each symbol should show a formatted value
            expect(getByText(/\$\d+\.\d{2}/)).toBeTruthy();
        },
    );

    it.each(['100', '1000', '10000', '0.001', '0.00000001'])(
        'should render with fee value %s',
        fee => {
            const { getByText } = renderFeePicker({
                fee,
                isLoading: false,
            });
            // Each fee should be formatted and displayed
            expect(getByText(/\$\d+\.\d{2}/)).toBeTruthy();
        },
    );

    it('should render the approximate symbol', () => {
        const { getByText } = renderFeePicker();

        expect(getByText('≈')).toBeTruthy();
    });
});
