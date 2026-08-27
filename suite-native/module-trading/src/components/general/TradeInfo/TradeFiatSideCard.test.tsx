import { Text } from '@suite-native/atoms';
import { getTranslation } from '@suite-native/intl';
import { renderWithBasicProvider } from '@suite-native/test-utils';
import type { ExtendedSellCryptoPaymentMethod } from '@suite-native/trading-types';

import { TradeFiatSideCard, type TradeFiatSideCardProps } from './TradeFiatSideCard';

describe('TradeFiatSideCard', () => {
    const renderTradeFiatSideCard = async (props: TradeFiatSideCardProps) =>
        await renderWithBasicProvider(<TradeFiatSideCard {...props} />);

    it('should render credit card payment method', async () => {
        const { getByText } = await renderTradeFiatSideCard({
            paymentMethod: 'creditCard',
            amount: <Text>+90.17</Text>,
            title: 'To',
            fiatCurrency: 'usd',
        });

        expect(
            getByText(getTranslation('moduleTrading.tradingExchangePreviewScreen.toAccount')),
        ).toBeOnTheScreen();
        expect(
            getByText(getTranslation('moduleTrading.paymentMethods.creditCard')),
        ).toBeOnTheScreen();
    });

    it('should render bank transfer payment method', async () => {
        const { getByText } = await renderTradeFiatSideCard({
            paymentMethod: 'bankTransfer',
            amount: <Text>+100.00</Text>,
            title: 'To',
            fiatCurrency: 'usd',
        });

        expect(
            getByText(getTranslation('moduleTrading.tradingExchangePreviewScreen.toAccount')),
        ).toBeOnTheScreen();
        expect(
            getByText(getTranslation('moduleTrading.paymentMethods.bankTransfer')),
        ).toBeOnTheScreen();
    });

    it('should render unknown payment method', async () => {
        const { getByText } = await renderTradeFiatSideCard({
            paymentMethod: 'customMethod' as ExtendedSellCryptoPaymentMethod,
            amount: <Text>+100.00</Text>,
            title: 'To',
            fiatCurrency: 'usd',
        });

        expect(
            getByText(getTranslation('moduleTrading.tradingExchangePreviewScreen.toAccount')),
        ).toBeOnTheScreen();
        expect(getByText('customMethod')).toBeOnTheScreen();
    });
});
