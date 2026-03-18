import { type AccountKey } from '@suite-common/wallet-types';
import { type PreloadedState, renderWithStoreProvider } from '@suite-native/test-utils';
import { getWalletState } from '@suite-native/trading-fixtures';

import { ExchangeApprovalForCard } from '../ExchangeApprovalForCard';

describe('ExchangeApprovalForCard', () => {
    const renderExchangeApprovalForCard = (preloadedState: PreloadedState = {}) =>
        renderWithStoreProvider(<ExchangeApprovalForCard />, { preloadedState });

    it('should render text based on redux state', () => {
        const preloadedState = { wallet: getWalletState({ tradeType: 'exchange' }) };
        preloadedState.wallet.trading.exchange.tradingAccountKey = 'eth-account-1' as AccountKey; // Todo: create properly via `createAccountKey()`

        const { getByText } = renderExchangeApprovalForCard(preloadedState);

        expect(getByText('For')).toBeOnTheScreen();
        expect(getByText('Ethereum')).toBeOnTheScreen();
        expect(getByText('Account')).toBeOnTheScreen();
        expect(getByText('Ethereum #1')).toBeOnTheScreen();
    });

    it('should render nothing when account is not found', () => {
        const preloadedState = { wallet: getWalletState({ tradeType: 'exchange' }) };

        const { toJSON } = renderExchangeApprovalForCard(preloadedState);

        expect(toJSON()).toBeNull();
    });
});
