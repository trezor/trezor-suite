import { getTranslation } from '@suite-native/intl';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';
import { getInitializedTradingStateWithQuotes } from '@suite-native/trading-fixtures';

import { SellConfirmation } from './SellConfirmation';

const CTA_TEXT = getTranslation('moduleTrading.tradingScreen.buttons.continue');

jest.mock('../../hooks/sell/useSellSelectQuote', () => ({
    useSellSelectQuote: jest.fn(),
}));

jest.mock('../../hooks/sell/useSellFormContext', () => ({
    useSellFormContext: () => ({
        control: undefined,
    }),
}));

describe('SellConfirmation', () => {
    const mockUseSellSelectQuote =
        require('../../hooks/sell/useSellSelectQuote').useSellSelectQuote;

    const renderConfirmation = () =>
        renderWithStoreProvider(<SellConfirmation />, {
            preloadedState: { wallet: { trading: getInitializedTradingStateWithQuotes() } },
        });

    it('should render continue button when canProceed is true', () => {
        mockUseSellSelectQuote.mockReturnValue({
            canProceed: true,
            selectQuote: jest.fn(),
            isLegalTermsConsentRequested: false,
            giveLegalTermsConsent: jest.fn(),
            cancelLegalTermsConsent: jest.fn(),
        });

        const { getByText } = renderConfirmation();

        expect(getByText(CTA_TEXT)).toBeTruthy();
    });

    it('should not render sell button when canProceed is false', () => {
        mockUseSellSelectQuote.mockReturnValue({
            canProceed: false,
            selectQuote: jest.fn(),
            isLegalTermsConsentRequested: false,
            giveLegalTermsConsent: jest.fn(),
            cancelLegalTermsConsent: jest.fn(),
        });

        const { queryByText } = renderConfirmation();

        expect(queryByText(CTA_TEXT)).toBeNull();
    });
});
