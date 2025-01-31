import { useCallback } from 'react';

import type {
    TradingPaymentMethodListProps,
    TradingPaymentMethodProps,
    TradingTradeMapProps,
} from '@suite-common/trading';

import { useSelector } from 'src/hooks/suite';
import { TradingTradeBuySellType } from 'src/types/trading/trading';
import { TradingPaymentMethodHookProps } from 'src/types/trading/tradingForm';

const useTradingPaymentMethod = <
    T extends TradingTradeBuySellType,
>(): TradingPaymentMethodHookProps<T> => {
    const paymentMethods = useSelector(state => state.wallet.trading.info.paymentMethods);

    const getPaymentMethods = (quotes: TradingTradeMapProps[T][]) => {
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
            quotes: TradingTradeMapProps[T][] | undefined,
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
