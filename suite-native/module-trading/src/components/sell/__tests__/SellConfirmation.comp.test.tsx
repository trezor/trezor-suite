import { renderWithStoreProviderAsync } from '@suite-native/test-utils';

import { getInitializedTradingStateWithQuotes } from '../../../__fixtures__/tradingState';
import { SellConfirmation } from '../SellConfirmation';

jest.mock('../../../hooks/sell/useSellFlow', () => ({
    useSellFlow: jest.fn(),
}));

jest.mock('../../../hooks/sell/useSellFormContext', () => ({
    useSellFormContext: () => ({
        watch: () => [{ exchange: 'test-provider' }, { symbol: 'btc' }],
    }),
}));

describe('SellConfirmation', () => {
    const mockUseSellFlow = require('../../../hooks/sell/useSellFlow').useSellFlow;

    const renderConfirmation = () =>
        renderWithStoreProviderAsync(<SellConfirmation />, {
            preloadedState: { wallet: { trading: getInitializedTradingStateWithQuotes() } },
        });

    it('should render continue button when canProceed is true', async () => {
        mockUseSellFlow.mockReturnValue({
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
        mockUseSellFlow.mockReturnValue({
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
