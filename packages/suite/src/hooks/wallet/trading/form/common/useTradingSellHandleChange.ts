import { useCallback, useEffect, useRef } from 'react';
import { type UseFormSetValue } from 'react-hook-form';

import { events } from '@suite/analytics';
import {
    TRADING_FORM_PAYMENT_METHOD_SELECT,
    type TradingSellFormProps,
    getTradingPaymentMethods,
    isCountrySubdivisionEmpty,
    sellThunks,
} from '@suite-common/trading';
import { type Network } from '@suite-common/wallet-config';

import { useDispatch } from 'src/hooks/suite';
import { useAnalytics } from 'src/support/useAnalytics';

type TradingSellUseHandleChangeProps = {
    formValues: TradingSellFormProps;
    network: Network;
    shouldSendInSats: boolean | undefined;

    setValue: UseFormSetValue<TradingSellFormProps>;
    composeRequestCallback: () => void;
};

type PromiseType = {
    abort: (message?: string) => void;
} | null;

/**
 * Wrapping the handleRequestThunk to have a better control
 * over the request.
 */
export const useTradingSellHandleChange = ({
    formValues,
    network,
    shouldSendInSats,
    setValue,
    composeRequestCallback,
}: TradingSellUseHandleChangeProps) => {
    const dispatch = useDispatch();
    const previousPromise = useRef<PromiseType>(null);
    const analytics = useAnalytics();
    const handleChange = useCallback(async () => {
        if (
            isCountrySubdivisionEmpty(
                formValues.countrySelect?.value,
                formValues.countrySubdivisionSelect?.value,
            )
        ) {
            return;
        }

        if (previousPromise.current) {
            previousPromise.current.abort('Request was replaced by another one.');
        }

        const promise = dispatch(
            sellThunks.handleRequestThunk({
                formValues,
                network,
                shouldSendInSats,
                composeRequestCallback,
            }),
        );

        previousPromise.current = promise;

        try {
            const quotes = await promise.unwrap();

            analytics.report({
                type: events.tradeReceivedQuotesEvent.name,
                payload: {
                    type: 'sell',
                    count: quotes?.length ?? 0,
                },
            });

            if (quotes) {
                const bestQuote = quotes?.[0];
                const bestQuotePaymentMethod = bestQuote?.paymentMethod;
                const bestQuotePaymentMethodName =
                    bestQuote?.paymentMethodName ?? bestQuotePaymentMethod;
                const paymentMethodSelected = formValues.paymentMethod?.value;
                const paymentMethodsFromQuotes = getTradingPaymentMethods(quotes);
                const isSelectedPaymentMethodAvailable =
                    paymentMethodsFromQuotes.find(item => item.value === paymentMethodSelected) !==
                    undefined;
                if (!paymentMethodSelected || !isSelectedPaymentMethodAvailable) {
                    setValue(TRADING_FORM_PAYMENT_METHOD_SELECT, {
                        value: bestQuotePaymentMethod ?? '',
                        label: bestQuotePaymentMethodName ?? '',
                    });
                }
            }
        } catch (error) {
            console.warn('Request was aborted:', error.message);
        }
    }, [
        dispatch,
        formValues,
        network,
        shouldSendInSats,
        composeRequestCallback,
        analytics,
        setValue,
    ]);

    // cleanup signal
    useEffect(
        () => () => {
            if (previousPromise.current) {
                previousPromise.current.abort('Request is canceled - page is unmounted.');
            }
        },
        [],
    );

    return { handleChange };
};
