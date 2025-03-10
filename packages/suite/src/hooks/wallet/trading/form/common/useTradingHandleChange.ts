import { useCallback, useEffect, useRef } from 'react';
import { UseFormSetValue } from 'react-hook-form';

import { TradingBuyFormProps, buyThunks, getTradingPaymentMethods } from '@suite-common/trading';
import { Network } from '@suite-common/wallet-config';
import { Timer } from '@trezor/react-utils';

import { FORM_PAYMENT_METHOD_SELECT } from 'src/constants/wallet/trading/form';
import { useDispatch } from 'src/hooks/suite';

type TradingUseHandleChangeProps = {
    formValues: TradingBuyFormProps;
    network: Network;
    timer: Timer;
    shouldSendInSats: boolean | undefined;

    setValue: UseFormSetValue<TradingBuyFormProps>;
};

type PromiseType = {
    abort: (message?: string) => void;
} | null;

/**
 * Wrapping the handleRequestThunk to have a better control
 * over the request.
 */
export const useTradingHandleChange = ({
    formValues,
    network,
    timer,
    shouldSendInSats,
    setValue,
}: TradingUseHandleChangeProps) => {
    const dispatch = useDispatch();
    const previousPromise = useRef<PromiseType>(null);

    const handleChange = useCallback(async () => {
        if (previousPromise.current) {
            previousPromise.current.abort('Request was replaced by another one.');
        }

        const promise = dispatch(
            buyThunks.handleRequestThunk({
                formValues,
                network,
                timer,
                shouldSendInSats,
            }),
        );

        previousPromise.current = promise;

        try {
            const quotes = await promise.unwrap();

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
                    setValue(FORM_PAYMENT_METHOD_SELECT, {
                        value: bestQuotePaymentMethod ?? '',
                        label: bestQuotePaymentMethodName ?? '',
                    });
                }
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                console.warn('Request was aborted:', error.message);
            }
        }
    }, [dispatch, formValues, network, timer, shouldSendInSats, setValue]);

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
