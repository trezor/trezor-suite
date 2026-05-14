import { Button } from '@suite-native/atoms';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';
import { getInitializedTradingStateWithQuotes } from '@suite-native/trading-fixtures';

import { BuyConfirmation } from '../BuyConfirmation';

const EXCHANGE_NAME = 'test-provider';
const CTA_TEXT = `Buy via ${EXCHANGE_NAME}`;

jest.mock('../../../hooks/buy/useBuyFlow', () => ({
    useBuyFlow: jest.fn(),
}));

jest.mock('../../../hooks/buy/useBuyFormContext', () => ({
    useBuyFormContext: () => ({
        watch: () => ({ exchange: EXCHANGE_NAME }),
    }),
}));

jest.mock('../../../hooks/general/useTradingStellarActivateToken', () => ({
    useTradingStellarActivateToken: jest.fn(),
}));

describe('BuyConfirmation', () => {
    const mockUseBuyFlow = require('../../../hooks/buy/useBuyFlow').useBuyFlow;
    const mockUseTradingStellarActivateToken =
        require('../../../hooks/general/useTradingStellarActivateToken').useTradingStellarActivateToken;

    const renderConfirmation = () =>
        renderWithStoreProvider(<BuyConfirmation />, {
            preloadedState: { wallet: { trading: getInitializedTradingStateWithQuotes() } },
        });

    beforeEach(() => {
        mockUseTradingStellarActivateToken.mockReturnValue({
            isReceivingInactiveStellarToken: false,
            activateButtonElement: null,
        });
    });

    it('should render buy button when canProceed is true', () => {
        mockUseBuyFlow.mockReturnValue({
            canProceed: true,
            selectQuote: jest.fn(),
            isConsentRequested: false,
            giveConsent: jest.fn(),
            cancelConsent: jest.fn(),
        });

        const { getByText } = renderConfirmation();
        expect(getByText(CTA_TEXT)).toBeTruthy();
    });

    it('should not render buy button when canProceed is false', () => {
        mockUseBuyFlow.mockReturnValue({
            canProceed: false,
            selectQuote: jest.fn(),
            isConsentRequested: false,
            giveConsent: jest.fn(),
            cancelConsent: jest.fn(),
        });

        const { queryByText } = renderConfirmation();

        expect(queryByText(CTA_TEXT)).toBeNull();
    });

    it('should render activate button when trading inactive Stellar token', () => {
        mockUseBuyFlow.mockReturnValue({
            canProceed: true,
            selectQuote: jest.fn(),
            isConsentRequested: false,
            giveConsent: jest.fn(),
            cancelConsent: jest.fn(),
        });

        mockUseTradingStellarActivateToken.mockReturnValue({
            isReceivingInactiveStellarToken: true,
            activateButtonElement: <Button>Activate</Button>,
        });

        const { queryByText } = renderConfirmation();
        expect(queryByText('Activate')).toBeTruthy();
        expect(queryByText(CTA_TEXT)).toBeNull();
    });

    it('should not render activate button when not trading inactive Stellar token', () => {
        mockUseBuyFlow.mockReturnValue({
            canProceed: true,
            selectQuote: jest.fn(),
            isConsentRequested: false,
            giveConsent: jest.fn(),
            cancelConsent: jest.fn(),
        });

        mockUseTradingStellarActivateToken.mockReturnValue({
            isReceivingInactiveStellarToken: false,
            activateButtonElement: <Button>Activate</Button>,
        });

        const { queryByText } = renderConfirmation();
        expect(queryByText('Activate')).toBeNull();
        expect(queryByText(CTA_TEXT)).toBeTruthy();
    });
});
