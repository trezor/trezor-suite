import { renderWithStoreProvider } from '@suite-native/test-utils-store';
import { getInitializedTradingStateWithQuotes } from '@suite-native/trading-fixtures';

import { SellConfirmation } from '../SellConfirmation';

jest.mock('../../../hooks/sell/useSellSelectQuote', () => ({
    useSellSelectQuote: jest.fn(),
}));

jest.mock('../../../hooks/sell/useSellFormContext', () => ({
    useSellFormContext: () => ({
        watch: (fields: any) => {
            if (Array.isArray(fields)) {
                return fields.map((field: string) => {
                    if (field === 'quote') return { exchange: 'test-provider' };

                    if (field === 'sendAsset') return { symbol: 'btc' };

                    return null;
                });
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

    it('should render continue button when canProceed is true', () => {
        mockUseSellSelectQuote.mockReturnValue({
            canProceed: true,
            selectQuote: jest.fn(),
            isLegalTermsConsentRequested: false,
            giveLegalTermsConsent: jest.fn(),
            cancelLegalTermsConsent: jest.fn(),
        });

        const { getByText } = renderConfirmation();

        expect(getByText('Continue')).toBeTruthy();
    });

    it('should not render continue button when canProceed is false', () => {
        mockUseSellSelectQuote.mockReturnValue({
            canProceed: false,
            selectQuote: jest.fn(),
            isLegalTermsConsentRequested: false,
            giveLegalTermsConsent: jest.fn(),
            cancelLegalTermsConsent: jest.fn(),
        });

        const { queryByText } = renderConfirmation();

        expect(queryByText('Continue')).toBeNull();
    });
});
