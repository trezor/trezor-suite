import { AccountKey } from '@suite-common/wallet-types';
// eslint-disable-next-line local-rules/no-package-deep-imports
import { PreloadedState, renderWithStoreProviderAsync } from '@suite-native/test-utils/store';
import { getWalletState } from '@suite-native/trading-fixtures';

import { ExchangeApprovalForCard } from '../ExchangeApprovalForCard';

describe('ExchangeApprovalForCard', () => {
    const renderExchangeApprovalForCard = (preloadedState: PreloadedState = {}) =>
        renderWithStoreProviderAsync(<ExchangeApprovalForCard />, { preloadedState });

    it('should render text based on redux state', async () => {
        const preloadedState = { wallet: getWalletState({ tradeType: 'exchange' }) };
        preloadedState.wallet.trading.exchange.tradingAccountKey = 'eth-account-1' as AccountKey; // Todo: create properly via `createAccountKey()`

        const { getByText } = await renderExchangeApprovalForCard(preloadedState);

        expect(getByText('For')).toBeOnTheScreen();
        expect(getByText('Ethereum')).toBeOnTheScreen();
        expect(getByText('Account')).toBeOnTheScreen();
        expect(getByText('Ethereum #1')).toBeOnTheScreen();
    });

    it('should render nothing when account is not found', async () => {
        const preloadedState = { wallet: getWalletState({ tradeType: 'exchange' }) };

        const { toJSON } = await renderExchangeApprovalForCard(preloadedState);

        expect(toJSON()).toBeNull();
    });
});
