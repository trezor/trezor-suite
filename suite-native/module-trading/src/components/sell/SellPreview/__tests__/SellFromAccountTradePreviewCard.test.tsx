import { type AccountKey } from '@suite-common/wallet-types';
import { banxaCreditCardSellQuote, eth1NormalAccount } from '@suite-native/trading-fixtures';

import { renderWithTradingProvider } from '../../../../__tests__/tradingTestUtils';
import {
    SellFromAccountTradePreviewCard,
    type SellFromAccountTradePreviewCardProps,
} from '../SellFromAccountTradePreviewCard';

describe('SellFromAccountTradePreviewCard', () => {
    const renderSellFromAccountTradePreviewCard = (
        props: Partial<SellFromAccountTradePreviewCardProps> = {},
        tradingAccountKey = eth1NormalAccount.key,
    ) =>
        renderWithTradingProvider(<SellFromAccountTradePreviewCard {...props} />, {
            tradeType: 'sell',
            overrides: {
                wallet: {
                    trading: { sell: { tradingAccountKey } },
                },
            },
        });

    it('should render nothing when there is no quote', () => {
        const { toJSON } = renderSellFromAccountTradePreviewCard({});

        expect(toJSON()).toBeNull();
    });

    it('should render nothing when account is not found', () => {
        const { toJSON } = renderSellFromAccountTradePreviewCard(
            { quote: banxaCreditCardSellQuote },
            'unknown-account-key' as AccountKey,
        );

        expect(toJSON()).toBeNull();
    });

    it('should render TradeSideCard otherwise', () => {
        const { getByText } = renderSellFromAccountTradePreviewCard({
            quote: banxaCreditCardSellQuote,
        });

        expect(getByText('From')).toBeOnTheScreen();
        expect(getByText('ETH Account #1')).toBeOnTheScreen();
        expect(getByText('-0.0233 ETH')).toBeOnTheScreen();
        expect(getByText('0.0233-ethereum')).toBeOnTheScreen();
    });
});
