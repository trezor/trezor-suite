import React from 'react';
import { Text } from 'react-native';

import { type TradingExchangeType, type TradingSellType } from '@suite-common/trading';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { getTranslation } from '@suite-native/intl';
import { btc1NormalAccount, mercuryoDexQuote } from '@suite-native/trading-fixtures';

import { TradeInfo } from './TradeInfo';
import { renderWithTradingProvider } from '../../../test-utils/tradingTestUtils';

const btc1AccountKey = mockAccountKey({ symbol: asNetworkSymbol('btc'), descriptor: 'btc1' });

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

    it('should keep the fee editable for a quote without a PSBT', async () => {
        await renderTradeInfo();

        expect(mockFeeSelectorProps).toHaveBeenCalledWith(
            expect.objectContaining({ isReadOnly: false }),
        );
    });

    it('should show the fee of a BTC DEX quote with a PSBT as read-only', async () => {
        await renderTradeInfo({
            accountKey: btc1NormalAccount.key,
            trade: {
                ...mercuryoDexQuote,
                send: 'bitcoin',
                dexTx: { from: 'from', to: 'to', data: 'cHNidP8B', value: '0' },
            },
        });

        expect(mockFeeSelectorProps).toHaveBeenCalledWith(
            expect.objectContaining({ isReadOnly: true }),
        );
    });

    it('should render children', async () => {
        const { getByText } = await renderTradeInfo({
            children: <Text>child content</Text>,
        });

        expect(getByText('child content')).toBeOnTheScreen();
    });
});
