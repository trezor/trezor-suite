import { renderWithProviders } from '@suite-native/test-utils';
import type { ExtendedSellCryptoPaymentMethod } from '@suite-native/trading-types';

import { TradeFiatSideCard, type TradeFiatSideCardProps } from '../TradeFiatSideCard';

describe('TradeFiatSideCard', () => {
    const renderTradeFiatSideCard = (props: TradeFiatSideCardProps) =>
        renderWithProviders(<TradeFiatSideCard {...props} />, { providers: ['intl'] });

    it('should render credit card payment method', () => {
        const { getByText } = renderTradeFiatSideCard({
            paymentMethod: 'creditCard',
            amount: '+90.17',
            title: 'To',
        });

        expect(getByText('To')).toBeOnTheScreen();
        expect(getByText('Credit/Debit Card')).toBeOnTheScreen();
    });

    it('should render bank transfer payment method', () => {
        const { getByText } = renderTradeFiatSideCard({
            paymentMethod: 'bankTransfer',
            amount: '+100.00',
            title: 'To',
        });

        expect(getByText('To')).toBeOnTheScreen();
        expect(getByText('Bank Transfer')).toBeOnTheScreen();
    });

    it('should render unknown payment method', () => {
        const { getByText } = renderTradeFiatSideCard({
            paymentMethod: 'customMethod' as ExtendedSellCryptoPaymentMethod,
            amount: '+100.00',
            title: 'To',
        });

        expect(getByText('To')).toBeOnTheScreen();
        expect(getByText('customMethod')).toBeOnTheScreen();
    });
});
