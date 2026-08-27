import { Button } from '@suite-native/atoms';
import { getTranslation } from '@suite-native/intl';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';
import { getInitializedTradingStateWithQuotes } from '@suite-native/trading-fixtures';

import { BuyConfirmation } from './BuyConfirmation';

const CTA_TEXT = getTranslation('moduleTrading.tradingScreen.buttons.continue');

jest.mock('../../hooks/buy/useBuyFlow', () => ({
    useBuyFlow: jest.fn(),
}));

jest.mock('@suite-native/forms', () => ({
    ...jest.requireActual('@suite-native/forms'),
    useWatch: () => [undefined, undefined],
}));

jest.mock('../../hooks/buy/useBuyFormContext', () => ({
    useBuyFormContext: () => ({
        control: undefined,
    }),
}));

jest.mock('../../hooks/general/useTradingStellarActivateToken', () => ({
    useTradingStellarActivateToken: jest.fn(),
}));

describe('BuyConfirmation', () => {
    const mockUseBuyFlow = require('../../hooks/buy/useBuyFlow').useBuyFlow;
    const mockUseTradingStellarActivateToken =
        require('../../hooks/general/useTradingStellarActivateToken').useTradingStellarActivateToken;

    const renderConfirmation = async () =>
        await renderWithStoreProvider(<BuyConfirmation />, {
            preloadedState: { wallet: { trading: getInitializedTradingStateWithQuotes() } },
        });

    beforeEach(() => {
        mockUseTradingStellarActivateToken.mockReturnValue({
            isReceivingInactiveStellarToken: false,
            activateButtonElement: null,
        });
    });

    it('should render buy button when canProceed is true', async () => {
        mockUseBuyFlow.mockReturnValue({
            canProceed: true,
            selectQuote: jest.fn(),
            isConsentRequested: false,
            giveConsent: jest.fn(),
            cancelConsent: jest.fn(),
        });

        const { getByText } = await renderConfirmation();
        expect(getByText(CTA_TEXT)).toBeTruthy();
    });

    it('should not render buy button when canProceed is false', async () => {
        mockUseBuyFlow.mockReturnValue({
            canProceed: false,
            selectQuote: jest.fn(),
            isConsentRequested: false,
            giveConsent: jest.fn(),
            cancelConsent: jest.fn(),
        });

        const { queryByText } = await renderConfirmation();

        expect(queryByText(CTA_TEXT)).toBeNull();
    });

    it('should render activate button when trading inactive Stellar token', async () => {
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

        const { queryByText } = await renderConfirmation();
        expect(queryByText('Activate')).toBeTruthy();
        expect(queryByText(CTA_TEXT)).toBeNull();
    });

    it('should not render activate button when not trading inactive Stellar token', async () => {
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

        const { queryByText } = await renderConfirmation();
        expect(queryByText('Activate')).toBeNull();
        expect(queryByText(CTA_TEXT)).toBeTruthy();
    });
});
