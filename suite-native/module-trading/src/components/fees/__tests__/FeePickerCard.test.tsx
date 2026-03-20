import React from 'react';

import { type TradingExchangeType, type TradingSellType } from '@suite-common/trading';
import { type AccountKey } from '@suite-common/wallet-types';
import { renderWithStoreProviderAsync } from '@suite-native/test-utils';

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

    const renderFeePickerCard = async (props = {}) => {
        const finalProps = { ...defaultProps, ...props };

        return await renderWithStoreProviderAsync(<FeePickerCard {...finalProps} />);
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render the details title', async () => {
        const { getByText } = await renderFeePickerCard();

        expect(getByText('Transaction details')).toBeTruthy();
    });

    it('should pass correct props to FeeSelector', async () => {
        await renderFeePickerCard();

        expect(mockFeeSelectorProps).toHaveBeenCalledWith(
            expect.objectContaining({
                accountKey: 'btc1',
                formDraftKey: expect.any(String),
            }),
        );
    });
});
