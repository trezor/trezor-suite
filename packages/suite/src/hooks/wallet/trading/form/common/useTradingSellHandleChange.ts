import { useCallback, useEffect, useRef } from 'react';
import type { UseFormSetValue } from 'react-hook-form';

import type { TradingSellFormProps } from '@suite-common/trading';
import {
    TRADING_FORM_PAYMENT_METHOD_SELECT,
    getTradingPaymentMethods,
    sellThunks,
} from '@suite-common/trading';
import type { Network } from '@suite-common/wallet-config';
import type { Timer } from '@trezor/react-utils';
import { EventType, analytics } from '@trezor/suite-analytics';

import { useDispatch } from 'src/hooks/suite';

type TradingSellUseHandleChangeProps = {
    formValues: TradingSellFormProps;
    network: Network;
    timer: Timer;
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
    timer,
    shouldSendInSats,
    setValue,
    composeRequestCallback,
}: TradingSellUseHandleChangeProps) => {
    const dispatch = useDispatch();
    const previousPromise = useRef<PromiseType>(null);

    const handleChange = useCallback(async () => {
        if (previousPromise.current) {
            previousPromise.current.abort('Request was replaced by another one.');
        }

        const promise = dispatch(
            sellThunks.handleRequestThunk({
                formValues,
                network,
                timer,
                shouldSendInSats,
                composeRequestCallback,
            }),
        );

        previousPromise.current = promise;

        try {
            const quotes = await promise.unwrap();

            analytics.report({
                type: EventType.TradingReceivedQuotes,
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
    }, [formValues, network, timer, shouldSendInSats, dispatch, composeRequestCallback, setValue]);

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
