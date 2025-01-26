import { useCallback } from 'react';

import { useSelector } from 'src/hooks/suite';
import {
    TradingPaymentMethodListProps,
    TradingPaymentMethodProps,
    TradingTradeBuySellType,
    TradingTradeDetailMapProps,
} from 'src/types/trading/trading';
import { TradingPaymentMethodHookProps } from 'src/types/trading/tradingForm';

const useTradingPaymentMethod = <
    T extends TradingTradeBuySellType,
>(): TradingPaymentMethodHookProps<T> => {
    const paymentMethods = useSelector(state => state.wallet.trading.info.paymentMethods);

    const getPaymentMethods = (quotes: TradingTradeDetailMapProps[T][]) => {
        const newPaymentMethods: TradingPaymentMethodListProps[] = [];

        quotes.forEach(quote => {
            const { paymentMethod } = quote;
            const isNotInArray = !newPaymentMethods.some(item => item.value === paymentMethod);

            if (typeof paymentMethod !== 'undefined' && isNotInArray) {
                const label = quote.paymentMethodName ?? paymentMethod;

                newPaymentMethods.push({ value: paymentMethod, label });
            }
        });

        return newPaymentMethods;
    };

    const getQuotesByPaymentMethod = useCallback(
        (
            quotes: TradingTradeDetailMapProps[T][] | undefined,
            currentPaymentMethod: TradingPaymentMethodProps,
        ) => {
            if (!quotes) return;

            return quotes.filter(
                quote =>
                    quote.paymentMethod === currentPaymentMethod &&
                    typeof quote.error === 'undefined',
            );
        },
        [],
    );

    return {
        paymentMethods,
        getPaymentMethods,
        getQuotesByPaymentMethod,
    };
};

export default useTradingPaymentMethod;
