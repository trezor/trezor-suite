import { BuyCryptoPaymentMethod, BuyTrade, SellFiatTrade } from 'invity-api';
import { Dispatch, useCallback, useEffect, useReducer } from 'react';
import {
    CoinmarketTradeBuySellType,
    CoinmarketTradeDetailMapProps,
} from 'src/types/coinmarket/coinmarket';

type PaymentMethodValueProps = BuyCryptoPaymentMethod | '';

export interface PaymentMethodListProps {
    value: PaymentMethodValueProps;
    label: string;
}

interface InitialStateProps {
    paymentMethod: PaymentMethodValueProps;
    paymentMethods: PaymentMethodListProps[];
}

type ActionType =
    | {
          type: 'FILTER_PAYMENT_METHOD';
          payload: PaymentMethodValueProps;
      }
    | {
          type: 'FILTER_SET_PAYMENT_METHODS';
          payload: BuyTrade[] | SellFiatTrade[];
      };

export interface UseCoinmarketFilterReducerOutputProps<T extends CoinmarketTradeBuySellType> {
    state: InitialStateProps;
    dispatch: Dispatch<ActionType>;
    actions: {
        handleFilterQuotes: (
            quotes: CoinmarketTradeDetailMapProps[T][] | undefined,
        ) => CoinmarketTradeDetailMapProps[T][] | undefined;
    };
}

const getPaymentMethods = <T extends CoinmarketTradeBuySellType>(
    quotes: CoinmarketTradeDetailMapProps[T][],
): PaymentMethodListProps[] => {
    const newPaymentMethods: PaymentMethodListProps[] = [];

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

const reducer = (state: InitialStateProps, action: ActionType) => {
    switch (action.type) {
        case 'FILTER_PAYMENT_METHOD':
            return {
                ...state,
                paymentMethod: action.payload,
            };
        case 'FILTER_SET_PAYMENT_METHODS': {
            const newPaymentMethods: PaymentMethodListProps[] = getPaymentMethods(action.payload);

            return {
                ...state,
                paymentMethods: newPaymentMethods,
            };
        }
        default:
            return state;
    }
};

export const useCoinmarketFilterReducer = <T extends CoinmarketTradeBuySellType>(
    quotes: CoinmarketTradeDetailMapProps[T][] | undefined,
): UseCoinmarketFilterReducerOutputProps<T> => {
    const initialState: InitialStateProps = {
        paymentMethod: '',
        paymentMethods: quotes ? getPaymentMethods(quotes) : [],
    };

    const [state, dispatch] = useReducer(reducer, initialState);

    // if payment method is not in payment methods then reset
    useEffect(() => {
        const isMethodInPaymentMethods = state.paymentMethods.find(
            item => item.value === state.paymentMethod,
        );

        if (!isMethodInPaymentMethods) {
            dispatch({ type: 'FILTER_PAYMENT_METHOD', payload: '' });
        }
    }, [state.paymentMethod, state.paymentMethods]);

    const handleFilterQuotes = useCallback(
        (quotes: CoinmarketTradeDetailMapProps[T][] | undefined) => {
            if (!quotes) return;

            return quotes.filter(quote => {
                if (state.paymentMethod === '') return true; // all

                return (
                    quote.paymentMethod === state.paymentMethod &&
                    typeof quote.error === 'undefined'
                );
            });
        },
        [state.paymentMethod],
    );

    return {
        state,
        dispatch,
        actions: {
            handleFilterQuotes,
        },
    };
};
