import { renderWithBasicProvider } from '@suite-native/test-utils';

import { Confirmation } from '../Confirmation';

jest.mock('../../../hooks/useTradingBuyFlow', () => ({
    useTradingBuyFlow: jest.fn(),
}));

jest.mock('../../../hooks/useTradingBuyFormContext', () => ({
    useTradingBuyFormContext: () => ({
        watch: () => 'test-provider',
    }),
}));

describe('Confirmation', () => {
    const mockUseTradingBuyFlow = require('../../../hooks/useTradingBuyFlow').useTradingBuyFlow;

    it('should render continue button when canProceed is true', () => {
        mockUseTradingBuyFlow.mockReturnValue({
            canProceed: true,
            selectQuote: jest.fn(),
            isConsentRequested: false,
            giveConsent: jest.fn(),
            cancelConsent: jest.fn(),
        });

        const { getByText } = renderWithBasicProvider(<Confirmation />);

        expect(getByText('Continue')).toBeDefined();
    });

    it('should not render continue button when canProceed is false', () => {
        mockUseTradingBuyFlow.mockReturnValue({
            canProceed: false,
            selectQuote: jest.fn(),
            isConsentRequested: false,
            giveConsent: jest.fn(),
            cancelConsent: jest.fn(),
        });

        const { queryByText } = renderWithBasicProvider(<Confirmation />);

        expect(queryByText('Continue')).toBeNull();
    });
});
