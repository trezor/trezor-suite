import { renderWithStoreProviderAsync } from '@suite-native/test-utils';

import { getInitializedTradingStateWithQuotes } from '../../../__fixtures__/tradingState';
import { BuyConfirmation } from '../BuyConfirmation';

jest.mock('../../../hooks/buy/useBuyFlow', () => ({
    useBuyFlow: jest.fn(),
}));

jest.mock('../../../hooks/buy/useBuyFormContext', () => ({
    useBuyFormContext: () => ({
        watch: () => 'test-provider',
    }),
}));

describe('BuyConfirmation', () => {
    const mockUseBuyFlow = require('../../../hooks/buy/useBuyFlow').useBuyFlow;

    const renderConfirmation = () =>
        renderWithStoreProviderAsync(<BuyConfirmation />, {
            preloadedState: { wallet: { tradingNew: getInitializedTradingStateWithQuotes() } },
        });

    it('should render continue button when canProceed is true', async () => {
        mockUseBuyFlow.mockReturnValue({
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
        mockUseBuyFlow.mockReturnValue({
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
