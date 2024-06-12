import { useCallback } from 'react';
import { useSelector } from 'src/hooks/suite';
import {
    CoinmarketPaymentMethodListProps,
    CoinmarketPaymentMethodProps,
    CoinmarketTradeBuySellType,
    CoinmarketTradeDetailMapProps,
} from 'src/types/coinmarket/coinmarket';
import { CoinmarketPaymentMethodHookProps } from 'src/types/coinmarket/coinmarketForm';

const useCoinmarketPaymentMethod = <
    T extends CoinmarketTradeBuySellType,
>(): CoinmarketPaymentMethodHookProps<T> => {
    const paymentMethods = useSelector(state => state.wallet.coinmarket.info.paymentMethods);

    const getPaymentMethods = (quotes: CoinmarketTradeDetailMapProps[T][]) => {
        const newPaymentMethods: CoinmarketPaymentMethodListProps[] = [];

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
            quotes: CoinmarketTradeDetailMapProps[T][] | undefined,
            currentPaymentMethod: CoinmarketPaymentMethodProps,
        ) => {
            if (!quotes) return;

            return quotes.filter(quote => {
                if (currentPaymentMethod === '') return true; // all

                return (
                    quote.paymentMethod === currentPaymentMethod &&
                    typeof quote.error === 'undefined'
                );
            });
        },
        [],
    );

    return {
        paymentMethods,
        getPaymentMethods,
        getQuotesByPaymentMethod,
    };
};

export default useCoinmarketPaymentMethod;
