// eslint-disable-next-line local-rules/no-package-deep-imports
import { renderWithStoreProviderAsync } from '@suite-native/test-utils/store';
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
        renderWithStoreProviderAsync(<SellConfirmation />, {
            preloadedState: { wallet: { trading: getInitializedTradingStateWithQuotes() } },
        });

    it('should render continue button when canProceed is true', async () => {
        mockUseSellSelectQuote.mockReturnValue({
            canProceed: true,
            selectQuote: jest.fn(),
            isLegalTermsConsentRequested: false,
            giveLegalTermsConsent: jest.fn(),
            cancelLegalTermsConsent: jest.fn(),
        });

        const { getByText } = await renderConfirmation();

        expect(getByText('Continue')).toBeTruthy();
    });

    it('should not render continue button when canProceed is false', async () => {
        mockUseSellSelectQuote.mockReturnValue({
            canProceed: false,
            selectQuote: jest.fn(),
            isLegalTermsConsentRequested: false,
            giveLegalTermsConsent: jest.fn(),
            cancelLegalTermsConsent: jest.fn(),
        });

        const { queryByText } = await renderConfirmation();

        expect(queryByText('Continue')).toBeNull();
    });
});
