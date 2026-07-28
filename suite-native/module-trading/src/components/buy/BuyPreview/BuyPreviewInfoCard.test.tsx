import { getTranslation } from '@suite-native/intl';
import { mercuryoApplePayBuyQuote } from '@suite-native/trading-fixtures';

import { BuyPreviewInfoCard } from './BuyPreviewInfoCard';
import { renderWithTradingProvider } from '../../../__tests__/tradingTestUtils';

describe('BuyPreviewInfoCard', () => {
    const renderCard = (quote = mercuryoApplePayBuyQuote) =>
        renderWithTradingProvider(<BuyPreviewInfoCard quote={quote} />, { tradeType: 'buy' });

    it('displays "you pay" label with formatted fiat amount', () => {
        const { getByText } = renderCard();

        expect(
            getByText(getTranslation('moduleTrading.tradingBuyPreviewScreen.youPay')),
        ).toBeOnTheScreen();
        expect(getByText('€10.00')).toBeOnTheScreen();
    });

    it('displays payment method name', () => {
        const { getByLabelText } = renderCard();

        expect(
            getByLabelText(getTranslation('moduleTrading.tradingScreen.selectedPaymentMethod')),
        ).toHaveTextContent('Apple Pay');
    });

    it('displays provider name', () => {
        const { getByText } = renderCard();

        expect(getByText('Mercuryo')).toBeOnTheScreen();
    });
});
