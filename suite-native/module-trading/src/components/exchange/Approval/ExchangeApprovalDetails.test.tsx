import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { getTranslation } from '@suite-native/intl';
import { eth1NormalAccount, mercuryoFixedWorstQuote } from '@suite-native/trading-fixtures';

import { ExchangeApprovalDetails } from './ExchangeApprovalDetails';
import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    renderWithTradingProvider,
} from '../../../test-utils/tradingTestUtils';

// Mock FeeSelector to avoid deep dependency chain (useFeesManagement, etc.)
jest.mock('@suite-native/transaction-management', () => ({
    ...jest.requireActual('@suite-native/transaction-management'),
    FeeSelector: jest.fn(() => null),
}));

describe('ExchangeApprovalDetails', () => {
    const mockOnApprovalTypeChange = jest.fn();
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const defaultOverrides: PreloadedStatePartial<TradingTestPreloadedState> = {
        wallet: {
            trading: {
                exchange: {
                    tradingAccountKey: eth1NormalAccount.key,
                    selectedQuote: mercuryoFixedWorstQuote,
                },
            },
        },
    };

    const renderExchangeApprovalDetails = async (
        overrides: PreloadedStatePartial<TradingTestPreloadedState> = defaultOverrides,
    ) =>
        await renderWithTradingProvider(
            <ExchangeApprovalDetails
                exchange="mercuryo"
                onApprovalTypeChange={mockOnApprovalTypeChange}
            />,
            {
                tradeType: 'exchange',
                overrides,
            },
        );

    beforeEach(() => {
        errorSpy.mockClear();
    });

    it('should render approval details', async () => {
        const { getByText } = await renderExchangeApprovalDetails();

        expect(
            getByText(getTranslation('moduleTrading.exchangeTradePreviewCard.account')),
        ).toBeOnTheScreen();
        expect(getByText(getTranslation('moduleTrading.tradingScreen.provider'))).toBeOnTheScreen();
        expect(
            getByText(getTranslation('moduleTrading.tradingExchangeApprovalScreen.limitLabel')),
        ).toBeOnTheScreen();
        expect(errorSpy).not.toHaveBeenCalled();
    });

    it('should render error when account is not found', async () => {
        const { getByText, queryByText } = await renderExchangeApprovalDetails({
            wallet: {
                trading: {
                    exchange: {
                        tradingAccountKey: mockAccountKey({ descriptor: 'unknownAccountKey' }),
                        selectedQuote: mercuryoFixedWorstQuote,
                    },
                },
            },
        });

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
