import { PreloadedState, renderWithStoreProviderAsync } from '@suite-native/test-utils';
import { exchangeQuotes, getWalletState } from '@suite-native/trading-fixtures';

import { ExchangeApprovalDetailsCard } from '../ExchangeApprovalDetailsCard';

describe('ExchangeApprovalDetailsCard', () => {
    let preloadedState: PreloadedState;

    const renderExchangeApprovalDetailsCard = () =>
        renderWithStoreProviderAsync(<ExchangeApprovalDetailsCard />, { preloadedState });

    beforeEach(() => {
        preloadedState = {
            wallet: getWalletState({
                tradeType: 'exchange',
            }),
        };
    });

    it('should render card', async () => {
        preloadedState!.wallet!.trading!.exchange!.preselectedQuote = exchangeQuotes[0];

        const { getByText } = await renderExchangeApprovalDetailsCard();

        expect(getByText('Approval details')).toBeTruthy();
        expect(getByText('Provider')).toBeTruthy();
        expect(getByText('Limit')).toBeTruthy();
        expect(getByText('Fee')).toBeTruthy();
    });

    it('should render nothing without preselectedQuote', async () => {
        const { toJSON } = await renderExchangeApprovalDetailsCard();

        expect(toJSON()).toBeNull();
    });
});
