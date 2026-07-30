import { getTranslation } from '@suite-native/intl';
import { fireEvent } from '@suite-native/test-utils-store';

import { BuyPreviewContinueButton } from './BuyPreviewContinueButton';
import { useBuyPreviewFlow } from '../../../hooks/buy/useBuyPreviewFlow';
import { renderWithTradingProvider } from '../../../test-utils/tradingTestUtils';

jest.mock('../../../hooks/buy/useBuyPreviewFlow', () => ({
    useBuyPreviewFlow: jest.fn(),
}));

describe('BuyPreviewContinueButton', () => {
    const mockUseBuyPreviewFlow = jest.mocked(useBuyPreviewFlow);

    const renderBuyPreviewContinueButton = (companyName = 'MoonPay') =>
        renderWithTradingProvider(<BuyPreviewContinueButton companyName={companyName} />, {
            tradeType: 'buy',
        });

    const buttonText = getTranslation('moduleTrading.tradingBuyPreviewScreen.buyVia', {
        companyName: 'MoonPay',
    });

    beforeEach(() => {
        mockUseBuyPreviewFlow.mockReturnValue({
            confirmTrade: jest.fn(),
            canProceed: false,
            isLoading: false,
        });
    });

    it('renders button with company name', () => {
        const { getByText } = renderBuyPreviewContinueButton();

        expect(getByText(buttonText)).toBeOnTheScreen();
    });

    it('calls confirmTrade when button is pressed and canProceed is true', () => {
        const confirmTradeMock = jest.fn();
        mockUseBuyPreviewFlow.mockReturnValue({
            confirmTrade: confirmTradeMock,
            canProceed: true,
            isLoading: false,
        });

        const { getByText } = renderBuyPreviewContinueButton();

        fireEvent.press(getByText(buttonText));

        expect(confirmTradeMock).toHaveBeenCalledTimes(1);
    });

    it('does not call confirmTrade when button canProceed is false', () => {
        const confirmTradeMock = jest.fn();
        mockUseBuyPreviewFlow.mockReturnValue({
            confirmTrade: confirmTradeMock,
            canProceed: false,
            isLoading: false,
        });

        const { getByText } = renderBuyPreviewContinueButton();

        fireEvent.press(getByText(buttonText));

        expect(confirmTradeMock).not.toHaveBeenCalled();
    });

    it('does not call confirmTrade while loading', () => {
        const confirmTradeMock = jest.fn();
        mockUseBuyPreviewFlow.mockReturnValue({
            confirmTrade: confirmTradeMock,
            canProceed: true,
            isLoading: true,
        });

        const { getByText } = renderBuyPreviewContinueButton();

        fireEvent.press(getByText(buttonText));

        expect(confirmTradeMock).not.toHaveBeenCalled();
    });
});
