import { NetworkSymbol } from '@suite-common/wallet-config';
import { type PreloadedState, renderWithStoreProviderAsync } from '@suite-native/test-utils/store';
import { exchangeQuotes, getWalletState } from '@suite-native/trading-fixtures';

import { ExchangeApprovalDetailsCard } from '../ExchangeApprovalDetailsCard';

describe('ExchangeApprovalDetailsCard', () => {
    let preloadedState: PreloadedState;

    const renderExchangeApprovalDetailsCard = (
        fee: string | undefined = '100000',
        isLoading = false,
        networkSymbol: NetworkSymbol | undefined,
    ) =>
        renderWithStoreProviderAsync(
            <ExchangeApprovalDetailsCard
                fee={fee}
                isLoading={isLoading}
                networkSymbol={networkSymbol}
            />,
            { preloadedState },
        );

    beforeEach(() => {
        preloadedState = {
            wallet: getWalletState({
                tradeType: 'exchange',
            }),
        };
    });

    it('should render card', async () => {
        preloadedState!.wallet!.trading!.exchange!.preselectedQuote = exchangeQuotes[0];

        const { getByText } = await renderExchangeApprovalDetailsCard('100000', false, 'eth');

        expect(getByText('Approval details')).toBeTruthy();
        expect(getByText('Provider')).toBeTruthy();
        expect(getByText('Limit')).toBeTruthy();
        expect(getByText('Fee')).toBeTruthy();
    });

    it('should render nothing without quote', async () => {
        const { toJSON } = await renderExchangeApprovalDetailsCard('100000', false, 'eth');

        expect(toJSON()).toBeNull();
    });

    it('should render nothing without networkSymbol', async () => {
        preloadedState!.wallet!.trading!.exchange!.preselectedQuote = exchangeQuotes[0];

        const { toJSON } = await renderExchangeApprovalDetailsCard('100000', false, undefined);

        expect(toJSON()).toBeNull();
    });
});
