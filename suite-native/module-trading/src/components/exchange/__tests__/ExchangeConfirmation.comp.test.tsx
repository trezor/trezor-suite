import { renderWithStoreProviderAsync } from '@suite-native/test-utils';

import { getInitializedTradingStateWithQuotes } from '../../../__fixtures__/tradingState';
import { ExchangeConfirmation } from '../ExchangeConfirmation';

jest.mock('../../../hooks/exchange/useExchangeFlow', () => ({
    useExchangeFlow: jest.fn(),
}));

jest.mock('../../../hooks/exchange/useExchangeFormContext', () => ({
    useExchangeFormContext: () => ({
        watch: () => ({
            send: 'BTC',
            receive: 'ETH',
            exchange: 'test-provider',
            isDex: false,
        }),
    }),
}));

describe('ExchangeConfirmation', () => {
    const mockUseExchangeFlow = require('../../../hooks/exchange/useExchangeFlow').useExchangeFlow;

    const renderConfirmation = () =>
        renderWithStoreProviderAsync(<ExchangeConfirmation />, {
            preloadedState: { wallet: { tradingNew: getInitializedTradingStateWithQuotes() } },
        });

    it('should render continue button when canProceed is true', async () => {
        mockUseExchangeFlow.mockReturnValue({
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
        mockUseExchangeFlow.mockReturnValue({
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
