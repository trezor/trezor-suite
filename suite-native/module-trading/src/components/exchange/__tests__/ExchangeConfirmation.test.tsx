import { renderWithStoreProvider } from '@suite-native/test-utils';
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
        renderWithStoreProvider(<ExchangeConfirmation />, {
            preloadedState: { wallet: { trading: getInitializedTradingStateWithQuotes() } },
        });

    beforeEach(() => {
        mockQuote.isDex = false;
        mockQuote.preapprovedStringAmount = undefined;
    });

    it('should render "Swap" button when canProceed is true and approval not needed', () => {
        mockUseExchangeSelectQuote.mockReturnValue({
            canProceed: true,
            selectQuote: jest.fn(),
            isConsentRequested: false,
            giveConsent: jest.fn(),
            cancelConsent: jest.fn(),
        });

        const { getByText } = renderConfirmation();
        expect(getByText('Swap')).toBeTruthy();
    });

    it('should render "Approve and swap" button when canProceed is true and approval needed', () => {
        mockQuote.isDex = true;

        mockUseExchangeSelectQuote.mockReturnValue({
            canProceed: true,
            selectQuote: jest.fn(),
            isConsentRequested: false,
            giveConsent: jest.fn(),
            cancelConsent: jest.fn(),
        });

        const { getByText } = renderConfirmation();
        expect(getByText('Approve and swap')).toBeTruthy();
    });

    it('should render "Swap" button when canProceed is true and approval status is approved', () => {
        mockQuote.isDex = false;

        mockUseExchangeSelectQuote.mockReturnValue({
            canProceed: true,
            selectQuote: jest.fn(),
            isConsentRequested: false,
            giveConsent: jest.fn(),
            cancelConsent: jest.fn(),
        });

        const { getByText } = renderConfirmation();
        expect(getByText('Swap')).toBeTruthy();
    });

    it('should render "Swap" button when canProceed is true and approval status is null', () => {
        mockQuote.isDex = false;

        mockUseExchangeSelectQuote.mockReturnValue({
            canProceed: true,
            selectQuote: jest.fn(),
            isConsentRequested: false,
            giveConsent: jest.fn(),
            cancelConsent: jest.fn(),
        });

        const { getByText } = renderConfirmation();
        expect(getByText('Swap')).toBeTruthy();
    });

    it('should not render button when canProceed is false', () => {
        mockQuote.isDex = false;

        mockUseExchangeSelectQuote.mockReturnValue({
            canProceed: false,
            selectQuote: jest.fn(),
            isConsentRequested: false,
            giveConsent: jest.fn(),
            cancelConsent: jest.fn(),
        });

        const { queryByText } = renderConfirmation();

        expect(queryByText('Swap')).toBeNull();
        expect(queryByText('Approve and swap')).toBeNull();
    });
});
