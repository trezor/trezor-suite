import React from 'react';

import { type TradingExchangeType, type TradingSellType } from '@suite-common/trading';
import { type AccountKey } from '@suite-common/wallet-types';
import { getTranslation } from '@suite-native/intl';

import { renderWithTradingProvider } from '../../../__tests__/tradingTestUtils';
import { FeePickerCard } from '../FeePickerCard';

// Mock FeeSelector to avoid deep dependency chain (useFeesManagement, etc.)
const mockFeeSelectorProps = jest.fn();
jest.mock('@suite-native/transaction-management', () => ({
    ...jest.requireActual('@suite-native/transaction-management'),
    FeeSelector: jest.fn(props => {
        mockFeeSelectorProps(props);

        return null;
    }),
}));

describe('FeePickerCard', () => {
    const defaultProps = {
        trade: undefined,
        accountKey: 'btc1' as AccountKey,
        tradingType: 'exchange' as TradingExchangeType | TradingSellType,
    };

    const renderFeePickerCard = (props = {}) => {
        const finalProps = { ...defaultProps, ...props };

        return renderWithTradingProvider(<FeePickerCard {...finalProps} />);
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render the details title', () => {
        const { getByText } = renderFeePickerCard();

        expect(
            getByText(getTranslation('moduleTrading.tradingExchangePreviewScreen.details')),
        ).toBeTruthy();
    });

    it('should pass correct props to FeeSelector', () => {
        renderFeePickerCard();

        expect(mockFeeSelectorProps).toHaveBeenCalledWith(
            expect.objectContaining({
                accountKey: 'btc1',
                formDraftKey: expect.any(String),
            }),
        );
    });
});
