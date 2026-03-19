import { type AccountKey } from '@suite-common/wallet-types';
import { type PreloadedState, renderWithStoreProvider } from '@suite-native/test-utils';
import { eth1NormalAccount, getWalletState, sellQuotes } from '@suite-native/trading-fixtures';

import {
    SellFromAccountTradePreviewCard,
    type SellFromAccountTradePreviewCardProps,
} from '../SellFromAccountTradePreviewCard';

describe('SellFromAccountTradePreviewCard', () => {
    const renderSellFromAccountTradePreviewCard = (
        props: Partial<SellFromAccountTradePreviewCardProps> = {},
        tradingAccountKey = eth1NormalAccount.key,
    ) => {
        const preloadedState: PreloadedState = {
            wallet: getWalletState({ tradeType: 'sell' }),
        };
        preloadedState.wallet!.trading!.sell!.tradingAccountKey = tradingAccountKey;

        return renderWithStoreProvider(<SellFromAccountTradePreviewCard {...props} />, {
            preloadedState,
        });
    };

    it('should render nothing when there is no quote', () => {
        const { toJSON } = renderSellFromAccountTradePreviewCard({});

        expect(toJSON()).toBeNull();
    });

    it('should render nothing when account is not found', () => {
        const { toJSON } = renderSellFromAccountTradePreviewCard(
            { quote: sellQuotes[0] },
            'unknown-account-key' as AccountKey,
        );

        expect(toJSON()).toBeNull();
    });

    it('should render TradeSideCard otherwise', () => {
        const { getByText } = renderSellFromAccountTradePreviewCard({ quote: sellQuotes[0] });

        expect(getByText('From')).toBeOnTheScreen();
        expect(getByText('ETH Account #1')).toBeOnTheScreen();
        expect(getByText('-0.0233 ETH')).toBeOnTheScreen();
        expect(getByText('0.0233-ethereum')).toBeOnTheScreen();
    });
});
