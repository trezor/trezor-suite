import { renderWithStoreProviderAsync } from '@suite-native/test-utils';

import { getInitializedTradingStateWithQuotes } from '../../../__fixtures__/tradingState';
import { BuyConfirmation } from '../BuyConfirmation';

jest.mock('../../../hooks/buy/useBuyFlow', () => ({
    useTradingBuyFlow: jest.fn(),
}));

jest.mock('../../../hooks/buy/useBuyFormContext', () => ({
    useTradingBuyFormContext: () => ({
        watch: () => 'test-provider',
    }),
}));

describe('Confirmation', () => {
    const mockUseTradingBuyFlow = require('../../../hooks/buy/useBuyFlow').useTradingBuyFlow;

    const renderConfirmation = () =>
        renderWithStoreProviderAsync(<BuyConfirmation />, {
            preloadedState: { wallet: { tradingNew: getInitializedTradingStateWithQuotes() } },
        });

    it('should render continue button when canProceed is true', async () => {
        mockUseTradingBuyFlow.mockReturnValue({
            canProceed: true,
            selectQuote: jest.fn(),
            isConsentRequested: false,
            giveConsent: jest.fn(),
            cancelConsent: jest.fn(),
        });

        const { getByText } = await renderConfirmation();
        expect(getByText('Continue')).toBeTruthy();
    });

    it('should not render continue button when canProceed is false', async () => {
        mockUseTradingBuyFlow.mockReturnValue({
            canProceed: false,
            selectQuote: jest.fn(),
            isConsentRequested: false,
            giveConsent: jest.fn(),
            cancelConsent: jest.fn(),
        });

        const { queryByText } = await renderConfirmation();

        expect(queryByText('Continue')).toBeNull();
    });
});
