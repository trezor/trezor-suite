import { getTranslation } from '@suite-native/intl';
import { mercuryoApplePayBuyQuote } from '@suite-native/trading-fixtures';

import { BuyPreviewInfoCard } from './BuyPreviewInfoCard';
import { renderWithTradingProvider } from '../../../test-utils/tradingTestUtils';

describe('BuyPreviewInfoCard', () => {
    const renderCard = async (quote = mercuryoApplePayBuyQuote) =>
        await renderWithTradingProvider(<BuyPreviewInfoCard quote={quote} />, { tradeType: 'buy' });

    it('displays "you pay" label with formatted fiat amount', async () => {
        const { getByText } = await renderCard();

        expect(
            getByText(getTranslation('moduleTrading.tradingBuyPreviewScreen.youPay')),
        ).toBeOnTheScreen();
        expect(getByText('€10.00')).toBeOnTheScreen();
    });

    it('displays payment method name', async () => {
        const { getByLabelText } = await renderCard();

        expect(
            getByLabelText(getTranslation('moduleTrading.tradingScreen.selectedPaymentMethod')),
        ).toHaveTextContent('Apple Pay');
    });

    it('displays provider name', async () => {
        const { getByText } = await renderCard();

        expect(getByText('Mercuryo')).toBeOnTheScreen();
    });
});
