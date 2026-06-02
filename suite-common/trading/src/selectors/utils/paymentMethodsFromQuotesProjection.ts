import { BigNumber } from '@trezor/utils';

import { type TradingPaymentMethodListProps } from '../../types';

type QuoteForPaymentMethod = {
    paymentMethod?: string;
    paymentMethodName?: string;
};

export const paymentMethodsFromQuotesProjection = <TQuote extends QuoteForPaymentMethod>(
    quotes: TQuote[],
    extract: (quote: TQuote) => Pick<TradingPaymentMethodListProps, 'receiveAmount' | 'symbol'>,
): TradingPaymentMethodListProps[] => {
    const methods = new Map<string, TradingPaymentMethodListProps>();
    quotes.forEach(quote => {
        const { paymentMethod } = quote;
        if (!paymentMethod || methods.has(paymentMethod)) {
            return;
        }
        methods.set(paymentMethod, {
            value: paymentMethod as TradingPaymentMethodListProps['value'],
            label: quote.paymentMethodName ?? paymentMethod,
            ...extract(quote),
        });
    });

    return Array.from(methods.values()).sort((a, b) =>
        new BigNumber(b.receiveAmount || '0')
            .minus(new BigNumber(a.receiveAmount || '0'))
            .toNumber(),
    );
};
