import React from 'react';

import { type TradingExchangeType, type TradingSellType } from '@suite-common/trading';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountKey } from '@suite-common/wallet-types';
import { renderWithStoreProvider, userEvent } from '@suite-native/test-utils';

import { FeePickerCard } from '../FeePickerCard';

const rateObject = { rate: 50000, error: null };

// Mock the selectors used by CryptoToFiatAmountFormatter
jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    selectBaseCurrency: jest.fn(() => 'usd'),
    selectFiatRatesByFiatRateKey: jest.fn(() => rateObject),
}));

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({
        navigate: mockNavigate,
    }),
}));

describe('FeePickerCard', () => {
    const defaultProps = {
        trade: undefined,
        accountKey: 'btc1' as AccountKey,
        symbol: 'btc' as NetworkSymbol,
        tradingType: 'exchange' as TradingExchangeType | TradingSellType,
    };

    const createPreloadedState = (fee: string) => ({
        wallet: {
            trading: {
                composedTransactionInfo: {
                    composed: {
                        fee,
                    },
                },
            },
        },
    });

    const renderFeePickerCard = (props = {}, preloadedState = {}) => {
        const finalProps = { ...defaultProps, ...props };

        return renderWithStoreProvider(<FeePickerCard {...finalProps} />, {
            preloadedState,
        });
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockNavigate.mockClear();
    });

    it('should render the details title', () => {
        const { getByText } = renderFeePickerCard({}, createPreloadedState('1000'));

        expect(getByText('Transaction details')).toBeTruthy();
    });

    it('should render fee label', () => {
        const { getByText } = renderFeePickerCard({}, createPreloadedState('1000'));

        expect(getByText('Fee')).toBeTruthy();
    });

    it('should render fee value with correct symbol', () => {
        const { getByText } = renderFeePickerCard(
            {
                symbol: 'eth' as NetworkSymbol,
            },
            createPreloadedState('5000'),
        );

        // Should show the formatted fee value
        expect(getByText('$0.00')).toBeTruthy();
    });

    it('should show loading state when fee is undefined', () => {
        const { getByTestId } = renderFeePickerCard({}, {});

        // When fee is undefined, should show skeleton
        const skeleton = getByTestId('BoxSkeleton');
        expect(skeleton).toBeTruthy();
    });

    it('should not show loading state when fee is defined', () => {
        const { getByText } = renderFeePickerCard({}, createPreloadedState('1000'));

        // When fee is defined, should show the formatted fee value
        expect(getByText('$0.50')).toBeTruthy();
    });

    it('should handle fee picker press and navigate to fees screen', async () => {
        const { getByText } = renderFeePickerCard({}, createPreloadedState('1000'));

        await userEvent.press(getByText('Fee'));

        expect(mockNavigate).toHaveBeenCalledWith('TradingFees', {
            accountKey: 'btc1',
            tradingType: 'exchange',
        });
    });

    it('should not navigate when actualFee is undefined', async () => {
        const { getByText } = renderFeePickerCard({}, {});

        await userEvent.press(getByText('Fee'));

        expect(mockNavigate).not.toHaveBeenCalled();
    });
});
