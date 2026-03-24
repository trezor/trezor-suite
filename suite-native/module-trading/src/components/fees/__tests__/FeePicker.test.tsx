import React from 'react';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { getTranslation } from '@suite-native/intl';
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

    it('should render fee label for bitcoin', () => {
        const { getByText } = renderFeePicker();

        expect(
            getByText(getTranslation('transactionManagement.fees.description.title.general')),
        ).toBeOnTheScreen();
    });

    it('should render fee label for ethereum', () => {
        const { getByText } = renderFeePicker({ symbol: 'eth' as NetworkSymbol });

        expect(
            getByText(getTranslation('transactionManagement.fees.description.title.ethereum')),
        ).toBeOnTheScreen();
    });

    it('should render fee value with correct symbol', () => {
        const { getByText } = renderFeePicker({
            fee: '5000',
            symbol: 'eth' as NetworkSymbol,
            isLoading: false,
        });

        // Should show the formatted fee value
        expect(getByText('$0.00')).toBeOnTheScreen();
        expect(getByText('0.000000000000005 ETH')).toBeOnTheScreen();
    });

    it('should render caret right icon', () => {
        const { getByTestId } = renderFeePicker();

        const icon = getByTestId('caret-down-icon');
        expect(icon).toBeOnTheScreen();
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
        const { getAllByTestId } = renderFeePicker({ isLoading: true });

        // When loading, should show skeleton
        const skeleton = getAllByTestId('BoxSkeleton');
        expect(skeleton.length).toBe(2);
    });

    it('should not show loading state when isLoading is false', () => {
        const { getByText } = renderFeePicker({ isLoading: false });

        // When not loading, should show the formatted fee value
        expect(getByText('$0.50')).toBeOnTheScreen();
        expect(getByText('0.00001 BTC')).toBeOnTheScreen();
    });

    it('should not show loading state when isLoading is undefined', () => {
        const { getByText } = renderFeePicker();

        // When isLoading is undefined, should show the formatted fee value
        expect(getByText('$0.50')).toBeOnTheScreen();
    });

    it.each(['btc', 'eth', 'ltc', 'bch', 'doge'])(
        'should render with %s network symbol',
        symbol => {
            const { getByText } = renderFeePicker({
                symbol: symbol as NetworkSymbol,
                isLoading: false,
            });
            // Each symbol should show a formatted value
            expect(getByText(/\$\d+\.\d{2}/)).toBeOnTheScreen();
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
            expect(getByText(/\$\d+\.\d{2}/)).toBeOnTheScreen();
        },
    );

    it('should render the approximate symbol', () => {
        const { getByText } = renderFeePicker();

        expect(getByText('≈')).toBeOnTheScreen();
    });
});
