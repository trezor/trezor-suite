import React from 'react';
import { Text } from 'react-native';

import { type TradingExchangeType, type TradingSellType } from '@suite-common/trading';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { getTranslation } from '@suite-native/intl';
import { mercuryoDexQuote } from '@suite-native/trading-fixtures';

import { TradeInfo } from './TradeInfo';
import { renderWithTradingProvider } from '../../../test-utils/tradingTestUtils';

const btcSymbol = asNetworkSymbol('btc');

const btc1AccountKey = mockAccountKey({ symbol: btcSymbol, descriptor: 'btc1' });

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

    const renderTradeInfo = async (props = {}) => {
        const finalProps = { ...defaultProps, ...props };

        return await renderWithTradingProvider(<TradeInfo {...finalProps} />);
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render provider', async () => {
        const { getByText } = await renderTradeInfo();

        expect(getByText(getTranslation('moduleTrading.tradingScreen.provider'))).toBeOnTheScreen();
        expect(getByText('Mercuryo')).toBeOnTheScreen();
    });

    it('should pass correct props to FeeSelector', async () => {
        await renderTradeInfo();

        expect(mockFeeSelectorProps).toHaveBeenCalledWith(
            expect.objectContaining({
                accountKey: btc1AccountKey,
                formDraftKey: expect.any(String),
                onFeeConfirmed: expect.any(Function),
            }),
        );
    });

    it('should render children', async () => {
        const { getByText } = await renderTradeInfo({
            children: <Text>child content</Text>,
        });

        expect(getByText('child content')).toBeOnTheScreen();
    });
});
