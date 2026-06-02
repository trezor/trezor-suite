import { paymentMethodsFromQuotesProjection } from '../paymentMethodsFromQuotesProjection';

type TestQuote = {
    orderId: string;
    paymentMethod?: string;
    paymentMethodName?: string;
    amount: string;
    symbol?: string;
};

const extract = (quote: TestQuote) => ({ receiveAmount: quote.amount, symbol: quote.symbol });

describe(paymentMethodsFromQuotesProjection.name, () => {
    it('keeps the first quote for each payment method and sorts by receiveAmount descending', () => {
        const quotes: TestQuote[] = [
            {
                orderId: 'bank-1',
                paymentMethod: 'bankTransfer',
                paymentMethodName: 'Bank Transfer',
                amount: '1',
                symbol: 'BTC',
            },
            {
                orderId: 'card-best',
                paymentMethod: 'creditCard',
                paymentMethodName: 'Credit Card',
                amount: '10',
                symbol: 'BTC',
            },
            {
                orderId: 'card-worse',
                paymentMethod: 'creditCard',
                paymentMethodName: 'Credit Card',
                amount: '0.0001',
                symbol: 'BTC',
            },
        ];

        const result = paymentMethodsFromQuotesProjection(quotes, extract);

        expect(result).toEqual([
            {
                value: 'creditCard',
                label: 'Credit Card',
                receiveAmount: '10',
                symbol: 'BTC',
            },
            {
                value: 'bankTransfer',
                label: 'Bank Transfer',
                receiveAmount: '1',
                symbol: 'BTC',
            },
        ]);
    });

    it('falls back to paymentMethod when paymentMethodName is missing', () => {
        const result = paymentMethodsFromQuotesProjection(
            [
                {
                    orderId: 'q1',
                    paymentMethod: 'creditCard',
                    amount: '1',
                    symbol: 'BTC',
                },
            ],
            extract,
        );

        expect(result[0]?.label).toBe('creditCard');
    });

    it('skips quotes without a paymentMethod', () => {
        const result = paymentMethodsFromQuotesProjection(
            [{ orderId: 'q1', amount: '1', symbol: 'BTC' }],
            extract,
        );

        expect(result).toEqual([]);
    });

    it('passes through undefined symbol from extract', () => {
        const result = paymentMethodsFromQuotesProjection(
            [
                {
                    orderId: 'q1',
                    paymentMethod: 'creditCard',
                    paymentMethodName: 'Credit Card',
                    amount: '1',
                    symbol: undefined,
                },
            ],
            extract,
        );

        expect(result[0]?.symbol).toBeUndefined();
    });
});
