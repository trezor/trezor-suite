import React from 'react';
import { Text } from 'react-native';

import { type TradingExchangeType, type TradingSellType } from '@suite-common/trading';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { getTranslation } from '@suite-native/intl';
import { mercuryoDexQuote } from '@suite-native/trading-fixtures';

import { TradeInfo } from './TradeInfo';
import { renderWithTradingProvider } from '../../../test-utils/tradingTestUtils';

const btc1AccountKey = mockAccountKey({ symbol: 'btc', descriptor: 'btc1' });

// Mock FeeSelector to avoid deep dependency chain (useFeesManagement, etc.)
const mockFeeSelectorProps = jest.fn();
jest.mock('@suite-native/transaction-management', () => ({
    ...jest.requireActual('@suite-native/transaction-management'),
    FeeSelectorRow: jest.fn(props => {
        mockFeeSelectorProps(props);

        return null;
    }),
}));

describe('TradeInfo', () => {
    const defaultProps = {
        trade: mercuryoDexQuote,
        accountKey: btc1AccountKey,
        tradingType: 'exchange' as TradingExchangeType | TradingSellType,
    };

    const renderTradeInfo = (props = {}) => {
        const finalProps = { ...defaultProps, ...props };

        return renderWithTradingProvider(<TradeInfo {...finalProps} />);
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render provider', () => {
        const { getByText } = renderTradeInfo();

        expect(getByText(getTranslation('moduleTrading.tradingScreen.provider'))).toBeOnTheScreen();
        expect(getByText('Mercuryo')).toBeOnTheScreen();
    });

    it('should pass correct props to FeeSelector', () => {
        renderTradeInfo();

        expect(mockFeeSelectorProps).toHaveBeenCalledWith(
            expect.objectContaining({
                accountKey: btc1AccountKey,
                formDraftKey: expect.any(String),
                onFeeConfirmed: expect.any(Function),
            }),
        );
    });

    it('should render children', () => {
        const { getByText } = renderTradeInfo({
            children: <Text>child content</Text>,
        });

        expect(getByText('child content')).toBeOnTheScreen();
    });
});
