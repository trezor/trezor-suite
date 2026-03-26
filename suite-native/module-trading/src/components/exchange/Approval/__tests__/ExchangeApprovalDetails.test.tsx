import type { AccountKey } from '@suite-common/wallet-types';
import { getTranslation } from '@suite-native/intl';
import { type PreloadedState, renderWithStoreProvider } from '@suite-native/test-utils';
import { eth1NormalAccount, exchangeQuotes, getWalletState } from '@suite-native/trading-fixtures';

import { ExchangeApprovalDetails } from '../ExchangeApprovalDetails';

// Mock FeeSelector to avoid deep dependency chain (useFeesManagement, etc.)
jest.mock('@suite-native/transaction-management', () => ({
    ...jest.requireActual('@suite-native/transaction-management'),
    FeeSelector: jest.fn(() => null),
}));

describe('ExchangeApprovalDetails', () => {
    let preloadedState: PreloadedState;
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const mockOnApprovalTypeChange = jest.fn();

    const renderExchangeApprovalDetails = () =>
        renderWithStoreProvider(
            <ExchangeApprovalDetails
                exchange="mercuryo"
                onApprovalTypeChange={mockOnApprovalTypeChange}
            />,
            {
                preloadedState,
            },
        );

    beforeEach(() => {
        preloadedState = {
            wallet: getWalletState({
                tradeType: 'exchange',
            }),
        };

        preloadedState!.wallet!.trading!.exchange!.tradingAccountKey = eth1NormalAccount.key;
        preloadedState!.wallet!.trading!.exchange!.preselectedQuote = exchangeQuotes[0];

        errorSpy.mockClear();
    });

    it('should render approval details', () => {
        const { getByText } = renderExchangeApprovalDetails();

        expect(
            getByText(getTranslation('moduleTrading.exchangeTradePreviewCard.account')),
        ).toBeOnTheScreen();
        expect(getByText(getTranslation('moduleTrading.tradingScreen.provider'))).toBeOnTheScreen();
        expect(
            getByText(getTranslation('moduleTrading.tradingExchangeApprovalScreen.limitLabel')),
        ).toBeOnTheScreen();
        expect(errorSpy).not.toHaveBeenCalled();
    });

    it('should render error when account is not found', () => {
        preloadedState!.wallet!.trading!.exchange!.tradingAccountKey =
            'unknown-account-key' as AccountKey;

        const { getByText, queryByText } = renderExchangeApprovalDetails();

        expect(
            getByText(
                getTranslation('moduleTrading.tradingExchangeApprovalScreen.approveErrorAlert'),
            ),
        ).toBeOnTheScreen();
        expect(
            queryByText(getTranslation('moduleTrading.exchangeTradePreviewCard.account')),
        ).toBeNull();
        expect(errorSpy).toHaveBeenCalledTimes(1);
        expect(errorSpy).toHaveBeenCalledWith('No account selected for exchange approval details');
    });
});
