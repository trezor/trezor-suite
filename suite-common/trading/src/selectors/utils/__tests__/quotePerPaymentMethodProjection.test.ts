import { bestQuotePerPaymentMethodProjection } from '../quotePerPaymentMethodProjection';

type PaymentMethod = 'bankTransfer' | 'creditCard' | 'applePay';

type TestQuote = {
    orderId: string;
    paymentMethod?: PaymentMethod;
    paymentMethodName?: string;
    rate?: number;
};

describe(bestQuotePerPaymentMethodProjection.name, () => {
    it('returns first valid quote for each payment method and sorts by rate', () => {
        const quotes: TestQuote[] = [
            {
                orderId: 'cexdirect-bank-1',
                paymentMethod: 'bankTransfer',
                paymentMethodName: 'Bank Transfer',
                rate: 20000,
            },
            {
                orderId: 'moonpay-bank-2',
                paymentMethod: 'bankTransfer',
                paymentMethodName: 'Bank Transfer',
                rate: 19500,
            },
            {
                orderId: 'mercuryo-applepay',
                paymentMethod: 'applePay',
                paymentMethodName: 'Apple Pay',
                rate: 19800,
            },
            {
                orderId: 'simplex-card',
                paymentMethod: 'creditCard',
                paymentMethodName: 'Credit Card',
                rate: 19900,
            },
        ];

        const result = bestQuotePerPaymentMethodProjection(quotes, (aRate, bRate) => bRate - aRate);

        expect(result.map(({ orderId }) => orderId)).toEqual([
            'cexdirect-bank-1',
            'simplex-card',
            'mercuryo-applepay',
        ]);
    });

    it('ignores quotes with missing payment method or payment method name', () => {
        const quotes: TestQuote[] = [
            {
                orderId: 'mercuryo-missing-name',
                paymentMethod: 'creditCard',
                rate: 21000,
            },
            {
                orderId: 'simplex-missing-method',
                paymentMethodName: 'Credit Card',
                rate: 20500,
            },
            {
                orderId: 'cexdirect-valid',
                paymentMethod: 'creditCard',
                paymentMethodName: 'Credit Card',
                rate: 20000,
            },
        ];

        const result = bestQuotePerPaymentMethodProjection(quotes, (aRate, bRate) => bRate - aRate);

        expect(result).toEqual([
            expect.objectContaining({
                orderId: 'cexdirect-valid',
            }),
        ]);
    });
});
