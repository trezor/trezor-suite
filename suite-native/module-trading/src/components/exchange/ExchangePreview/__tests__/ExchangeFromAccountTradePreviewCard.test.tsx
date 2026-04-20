import type { AccountKey } from '@suite-common/wallet-types';
import { type PreloadedState, renderWithStoreProvider } from '@suite-native/test-utils';
import {
    eth1NormalAccount,
    getWalletState,
    mercuryoFixedWorstQuote,
} from '@suite-native/trading-fixtures';

import {
    ExchangeFromAccountTradePreviewCard,
    type ExchangeFromAccountTradePreviewCardProps,
} from '../ExchangeFromAccountTradePreviewCard';

describe('ExchangeFromAccountTradePreviewCard', () => {
    const renderExchangeFromAccountTradePreviewCard = (
        props: Partial<ExchangeFromAccountTradePreviewCardProps> = {},
        tradingAccountKey = eth1NormalAccount.key,
    ) => {
        const preloadedState: PreloadedState = {
            wallet: getWalletState({ tradeType: 'exchange' }),
        };
        preloadedState.wallet!.trading!.composedTransactionInfo = { composed: { fee: '1000' } };
        preloadedState.wallet!.trading!.exchange!.tradingAccountKey = tradingAccountKey;

        return renderWithStoreProvider(<ExchangeFromAccountTradePreviewCard {...props} />, {
            preloadedState,
        });
    };

    it('should render nothing when there is no quote', () => {
        const { toJSON } = renderExchangeFromAccountTradePreviewCard({});

        expect(toJSON()).toBeNull();
    });

    it('should render nothing when account is not found', () => {
        const { toJSON } = renderExchangeFromAccountTradePreviewCard(
            { quote: mercuryoFixedWorstQuote },
            'unknown-account-key' as AccountKey,
        );

        expect(toJSON()).toBeNull();
    });

    it('should render TradeSideCard otherwise', () => {
        const { getByText } = renderExchangeFromAccountTradePreviewCard({
            quote: mercuryoFixedWorstQuote,
        });

        expect(getByText('From')).toBeOnTheScreen();
        expect(getByText('ETH Account #1')).toBeOnTheScreen();
        expect(getByText('-100 USDC')).toBeOnTheScreen();
        expect(getByText(`100-${mercuryoFixedWorstQuote.send}`)).toBeOnTheScreen();
    });

    it('should display correct account name', () => {
        const { getByText } = renderExchangeFromAccountTradePreviewCard({
            quote: mercuryoFixedWorstQuote,
        });
        expect(getByText('ETH Account #1')).toBeOnTheScreen();
    });
});
