// eslint-disable-next-line local-rules/no-package-deep-imports
import { renderWithStoreProviderAsync } from '@suite-native/test-utils/store';
import { getInitializedTradingStateWithQuotes } from '@suite-native/trading-fixtures';

import { ExchangeConfirmation } from '../ExchangeConfirmation';

jest.mock('../../../hooks/exchange/useExchangeSelectQuote', () => ({
    useExchangeSelectQuote: jest.fn(),
}));

const mockQuote = {
    send: 'BTC',
    receive: 'ETH',
    exchange: 'test-provider',
    isDex: false,
    preapprovedStringAmount: undefined,
};

jest.mock('../../../hooks/exchange/useExchangeFormContext', () => ({
    useExchangeFormContext: () => ({
        watch: () => mockQuote,
    }),
}));

describe('ExchangeConfirmation', () => {
    const mockUseExchangeSelectQuote =
        require('../../../hooks/exchange/useExchangeSelectQuote').useExchangeSelectQuote;

    const renderConfirmation = () =>
        renderWithStoreProviderAsync(<ExchangeConfirmation />, {
            preloadedState: { wallet: { trading: getInitializedTradingStateWithQuotes() } },
        });

    beforeEach(() => {
        mockQuote.isDex = false;
        mockQuote.preapprovedStringAmount = undefined;
    });

    it('should render "Swap" button when canProceed is true and approval not needed', async () => {
        mockUseExchangeSelectQuote.mockReturnValue({
            canProceed: true,
            selectQuote: jest.fn(),
            isConsentRequested: false,
            giveConsent: jest.fn(),
            cancelConsent: jest.fn(),
        });

        const { getByText } = await renderConfirmation();
        expect(getByText('Swap')).toBeTruthy();
    });

    it('should render "Approve and swap" button when canProceed is true and approval needed', async () => {
        mockQuote.isDex = true;

        mockUseExchangeSelectQuote.mockReturnValue({
            canProceed: true,
            selectQuote: jest.fn(),
            isConsentRequested: false,
            giveConsent: jest.fn(),
            cancelConsent: jest.fn(),
        });

        const { getByText } = await renderConfirmation();
        expect(getByText('Approve and swap')).toBeTruthy();
    });

    it('should render "Swap" button when canProceed is true and approval status is approved', async () => {
        mockQuote.isDex = false;

        mockUseExchangeSelectQuote.mockReturnValue({
            canProceed: true,
            selectQuote: jest.fn(),
            isConsentRequested: false,
            giveConsent: jest.fn(),
            cancelConsent: jest.fn(),
        });

        const { getByText } = await renderConfirmation();
        expect(getByText('Swap')).toBeTruthy();
    });

    it('should render "Swap" button when canProceed is true and approval status is null', async () => {
        mockQuote.isDex = false;

        mockUseExchangeSelectQuote.mockReturnValue({
            canProceed: true,
            selectQuote: jest.fn(),
            isConsentRequested: false,
            giveConsent: jest.fn(),
            cancelConsent: jest.fn(),
        });

        const { getByText } = await renderConfirmation();
        expect(getByText('Swap')).toBeTruthy();
    });

    it('should not render button when canProceed is false', async () => {
        mockQuote.isDex = false;

        mockUseExchangeSelectQuote.mockReturnValue({
            canProceed: false,
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
