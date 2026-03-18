import { renderWithStoreProvider } from '@suite-native/test-utils';
import { getInitializedTradingStateWithQuotes } from '@suite-native/trading-fixtures';

import { BuyConfirmation } from '../BuyConfirmation';

jest.mock('../../../hooks/buy/useBuyFlow', () => ({
    useBuyFlow: jest.fn(),
}));

jest.mock('../../../hooks/buy/useBuyFormContext', () => ({
    useBuyFormContext: () => ({
        watch: () => ({ exchange: 'test-provider' }),
    }),
}));

describe('BuyConfirmation', () => {
    const mockUseBuyFlow = require('../../../hooks/buy/useBuyFlow').useBuyFlow;

    const renderConfirmation = () =>
        renderWithStoreProvider(<BuyConfirmation />, {
            preloadedState: { wallet: { trading: getInitializedTradingStateWithQuotes() } },
        });

    it('should render continue button when canProceed is true', () => {
        mockUseBuyFlow.mockReturnValue({
            canProceed: true,
            selectQuote: jest.fn(),
            isConsentRequested: false,
            giveConsent: jest.fn(),
            cancelConsent: jest.fn(),
        });

        const { getByText } = renderConfirmation();
        expect(getByText('Continue')).toBeTruthy();
    });

    it('should not render continue button when canProceed is false', () => {
        mockUseBuyFlow.mockReturnValue({
            canProceed: false,
            selectQuote: jest.fn(),
            isConsentRequested: false,
            giveConsent: jest.fn(),
            cancelConsent: jest.fn(),
        });

        const { queryByText } = renderConfirmation();

        expect(queryByText('Continue')).toBeNull();
    });
});
