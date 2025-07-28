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

    it('should render "Swap" button when canProceed is true and approval not needed', async () => {
        mockUseExchangeFlow.mockReturnValue({
            canProceed: true,
            approvalStatus: 'not_needed',
            selectQuote: jest.fn(),
            isConsentRequested: false,
            giveConsent: jest.fn(),
            cancelConsent: jest.fn(),
        });

        const { getByText } = await renderConfirmation();
        expect(getByText('Swap')).toBeTruthy();
    });

    it('should render "Approve and swap" button when canProceed is true and approval needed', async () => {
        mockUseExchangeFlow.mockReturnValue({
            canProceed: true,
            approvalStatus: 'needs_approval',
            selectQuote: jest.fn(),
            isConsentRequested: false,
            giveConsent: jest.fn(),
            cancelConsent: jest.fn(),
        });

        const { getByText } = await renderConfirmation();
        expect(getByText('Approve and swap')).toBeTruthy();
    });

    it('should render "Swap" button when canProceed is true and approval status is approved', async () => {
        mockUseExchangeFlow.mockReturnValue({
            canProceed: true,
            approvalStatus: 'approved',
            selectQuote: jest.fn(),
            isConsentRequested: false,
            giveConsent: jest.fn(),
            cancelConsent: jest.fn(),
        });

        const { getByText } = await renderConfirmation();
        expect(getByText('Swap')).toBeTruthy();
    });

    it('should render "Swap" button when canProceed is true and approval status is null', async () => {
        mockUseExchangeFlow.mockReturnValue({
            canProceed: true,
            approvalStatus: null,
            selectQuote: jest.fn(),
            isConsentRequested: false,
            giveConsent: jest.fn(),
            cancelConsent: jest.fn(),
        });

        const { getByText } = await renderConfirmation();
        expect(getByText('Swap')).toBeTruthy();
    });

    it('should not render button when canProceed is false', async () => {
        mockUseExchangeFlow.mockReturnValue({
            canProceed: false,
            approvalStatus: 'not_needed',
            selectQuote: jest.fn(),
            isConsentRequested: false,
            giveConsent: jest.fn(),
            cancelConsent: jest.fn(),
        });

        const { queryByText } = await renderConfirmation();

        expect(queryByText('Swap')).toBeNull();
        expect(queryByText('Approve and swap')).toBeNull();
    });
});
