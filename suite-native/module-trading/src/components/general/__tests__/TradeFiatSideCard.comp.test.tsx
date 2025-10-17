import { renderWithBasicProvider } from '@suite-native/test-utils';

import { TradeFiatSideCard, type TradeFiatSideCardProps } from '../TradeFiatSideCard';

describe('TradeFiatSideCard', () => {
    const renderTradeFiatSideCard = (props: TradeFiatSideCardProps) =>
        renderWithBasicProvider(<TradeFiatSideCard {...props} />);

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

    it('should handle exhaustive case for unknown payment method', () => {
        // This test ensures the exhaustive function is called for unknown payment methods
        // The exhaustive function will throw an error for unknown values
        expect(() => {
            renderTradeFiatSideCard({
                paymentMethod: 'unknown' as any,
                amount: '+90.17',
                title: 'To',
            });
        }).toThrow();
    });
});
