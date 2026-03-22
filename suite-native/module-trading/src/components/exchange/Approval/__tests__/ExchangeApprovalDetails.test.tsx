import type { AccountKey } from '@suite-common/wallet-types';
import { type PreloadedState, renderWithStoreProvider } from '@suite-native/test-utils';
import { eth1NormalAccount, exchangeQuotes, getWalletState } from '@suite-native/trading-fixtures';

import { ExchangeApprovalDetails } from '../ExchangeApprovalDetails';

describe('ExchangeApprovalDetails', () => {
    let preloadedState: PreloadedState;

    const renderExchangeApprovalDetails = (fee: string | undefined = '100000', isLoading = false) =>
        renderWithStoreProvider(
            <ExchangeApprovalDetails fee={fee} isLoading={isLoading} exchange="mercuryo" />,
            { preloadedState },
        );

    beforeEach(() => {
        preloadedState = {
            wallet: getWalletState({
                tradeType: 'exchange',
            }),
        };

        preloadedState!.wallet!.trading!.exchange!.tradingAccountKey = eth1NormalAccount.key;
        preloadedState!.wallet!.trading!.exchange!.preselectedQuote = exchangeQuotes[0];
    });

    it('should render approval details', () => {
        const { getByText } = renderExchangeApprovalDetails('100000', false);

        expect(getByText('Account')).toBeOnTheScreen();
        expect(getByText('Provider')).toBeOnTheScreen();
        expect(getByText('Limit')).toBeOnTheScreen();
        expect(getByText('Maximum fee')).toBeOnTheScreen();
    });

    // TODO 25971 would be better to render some alert
    it('should render nothing when account is not found', () => {
        preloadedState!.wallet!.trading!.exchange!.tradingAccountKey =
            'unknown-account-key' as AccountKey;

        const { toJSON } = renderExchangeApprovalDetails('100000', false);

        expect(toJSON()).toBeNull();
    });
});
