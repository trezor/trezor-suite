import { type PreloadedState, renderWithStoreProvider } from '@suite-native/test-utils';
import { eth1NormalAccount, getWalletState } from '@suite-native/trading-fixtures';

import { ExchangeApprovalForCard } from '../ExchangeApprovalForCard';

describe('ExchangeApprovalForCard', () => {
    const renderExchangeApprovalForCard = (preloadedState: PreloadedState = {}) =>
        renderWithStoreProvider(<ExchangeApprovalForCard />, { preloadedState });

    it('should render text based on redux state', () => {
        const preloadedState = { wallet: getWalletState({ tradeType: 'exchange' }) };
        preloadedState.wallet.trading.exchange.tradingAccountKey = eth1NormalAccount.key;

        const { getByText } = renderExchangeApprovalForCard(preloadedState);

        expect(getByText('Account')).toBeOnTheScreen();
        expect(getByText('ETH Account #1')).toBeOnTheScreen();
    });

    it('should render nothing when account is not found', () => {
        const preloadedState = { wallet: getWalletState({ tradeType: 'exchange' }) };

        const { toJSON } = renderExchangeApprovalForCard(preloadedState);

        expect(toJSON()).toBeNull();
    });
});
