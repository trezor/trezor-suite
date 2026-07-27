type QuoteWithPaymentMethod<TPaymentMethod extends string> = {
    paymentMethod?: TPaymentMethod;
    paymentMethodName?: string;
    rate?: number;
};

export const bestQuotePerPaymentMethodProjection = <
    TPaymentMethod extends string,
    TQuote extends QuoteWithPaymentMethod<TPaymentMethod>,
>(
    quotes: TQuote[],
    sortRates: (aRate: number, bRate: number) => number,
) => {
    const bestQuoteByPaymentMethodMap = quotes.reduce((quotesByPaymentMethodMap, quote) => {
        const { paymentMethod, paymentMethodName } = quote;
        const isValidPaymentMethod = paymentMethod && paymentMethodName;

        if (isValidPaymentMethod && !quotesByPaymentMethodMap.has(paymentMethod)) {
            quotesByPaymentMethodMap.set(paymentMethod, quote);
        }

        return quotesByPaymentMethodMap;
    }, new Map<TPaymentMethod, TQuote>());

    return [...bestQuoteByPaymentMethodMap.values()].sort(({ rate: aRate }, { rate: bRate }) =>
        sortRates(aRate ?? 0, bRate ?? 0),
    );
};
