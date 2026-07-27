import { getTranslation } from '@suite-native/intl';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';
import { getInitializedTradingStateWithQuotes } from '@suite-native/trading-fixtures';

import { SellConfirmation } from '../SellConfirmation';

const EXCHANGE_NAME = 'test-provider';
const CTA_TEXT = getTranslation('moduleTrading.tradingScreen.buttons.sellVia', {
    providerName: EXCHANGE_NAME,
});

jest.mock('../../../hooks/sell/useSellSelectQuote', () => ({
    useSellSelectQuote: jest.fn(),
}));

jest.mock('../../../hooks/sell/useSellFormContext', () => ({
    useSellFormContext: () => ({
        watch: (fields: any) => {
            if (Array.isArray(fields)) {
                return fields.map((field: string) => {
                    if (field === 'quote') return { exchange: EXCHANGE_NAME };

                    if (field === 'sendAsset') return { symbol: 'btc' };

                    return null;
                });
            }

            if (fields === 'quote') {
                return { exchange: EXCHANGE_NAME };
            }

            return null;
        },
    }),
}));

describe('SellConfirmation', () => {
    const mockUseSellSelectQuote =
        require('../../../hooks/sell/useSellSelectQuote').useSellSelectQuote;

    const renderConfirmation = () =>
        renderWithStoreProvider(<SellConfirmation />, {
            preloadedState: { wallet: { trading: getInitializedTradingStateWithQuotes() } },
        });

    it('should render sell button with provider name when canProceed is true', () => {
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
