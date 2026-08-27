import { getTranslation } from '@suite-native/intl';
import { banxaCreditCardSellQuote, eth1NormalAccount } from '@suite-native/trading-fixtures';

import { SellFromAccountCard, type SellFromAccountCardProps } from './SellFromAccountCard';
import { renderWithTradingProvider } from '../../test-utils/tradingTestUtils';

describe('SellFromAccountCard', () => {
    const renderSellFromAccountCard = async (
        props: Partial<SellFromAccountCardProps> = {},
        tradingAccountKey = eth1NormalAccount.key,
    ) =>
        await renderWithTradingProvider(<SellFromAccountCard {...props} />, {
            tradeType: 'sell',
            overrides: {
                wallet: {
                    trading: { sell: { tradingAccountKey } },
                },
            },
        });

    it('should render TradeSideCard', async () => {
        const { getByText } = await renderSellFromAccountCard({
            quote: banxaCreditCardSellQuote,
        });

        expect(
            getByText(getTranslation('moduleTrading.tradingSellPreviewScreen.youPay')),
        ).toBeOnTheScreen();
        expect(getByText('ETH Account #1')).toBeOnTheScreen();
        expect(getByText('-0.0233 ETH')).toBeOnTheScreen();
    });
});
