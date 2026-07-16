import { useCallback, useEffect, useRef, useState } from 'react';
import {
    type Control,
    type UseFormGetValues,
    type UseFormSetValue,
    useFormState,
    useWatch,
} from 'react-hook-form';

import useDebounce from 'react-use/lib/useDebounce';

import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { useServices } from '@suite-common/dependency-injection';
import {
    TRADING_FORM_COUNTRY_SELECT,
    TRADING_FORM_COUNTRY_SUBDIVISION_SELECT,
    TRADING_FORM_OUTPUT_AMOUNT,
    TRADING_FORM_OUTPUT_CURRENCY,
    TRADING_FORM_OUTPUT_FIAT,
    TRADING_FORM_PAYMENT_METHOD_SELECT,
    TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT,
    type TradingSellFormProps,
    sellThunks,
    tradingActions,
    useTradingRefetchScheduler,
} from '@suite-common/trading';
import { type Network } from '@suite-common/wallet-config';

import { useDispatch } from 'src/hooks/suite';
import { isSellQuotesFetchAllowed } from 'src/utils/wallet/trading/sellQuotesRequestUtils';

type UseSellQuotesProps = {
    control: Control<TradingSellFormProps>;
    getValues: UseFormGetValues<TradingSellFormProps>;
    setValue: UseFormSetValue<TradingSellFormProps>;
    network: Network;
    shouldSendInSats: boolean | undefined;
    composeRequestCallback: () => void;
};

type AbortableRequest = {
    abort: (message?: string) => void;
} | null;

const SELL_QUOTES_KEY_FIELDS = [
    TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT,
    TRADING_FORM_COUNTRY_SELECT,
    TRADING_FORM_COUNTRY_SUBDIVISION_SELECT,
    TRADING_FORM_OUTPUT_CURRENCY,
    TRADING_FORM_OUTPUT_FIAT,
    TRADING_FORM_OUTPUT_AMOUNT,
] as const;

export const useSellQuotes = ({
    control,
    getValues,
    setValue,
    network,
    shouldSendInSats,
    composeRequestCallback,
}: UseSellQuotesProps) => {
    const dispatch = useDispatch();
    const { analytics } = useServices(selectDesktopAnalyticsDep);

    const previousRequest = useRef<AbortableRequest>(null);

    // TODO: source control/getValues/setValue via useFormContext() once the trading-form family  migrates to FormProvider
    useWatch({ control, name: SELL_QUOTES_KEY_FIELDS });
    const { isValid } = useFormState({ control });

    const values = getValues();
    const isFetchAllowed = isValid && isSellQuotesFetchAllowed(values);

    const output = values.outputs?.[0];
    const amountKey = JSON.stringify({
        amount: output?.amount,
    });
    const selectKey = JSON.stringify({
        cryptoId: values.sendCryptoSelect?.id,
        accountKey: values.sendCryptoSelect?.accountKey,
        country: values.countrySelect?.value,
        countrySubdivision: values.countrySubdivisionSelect?.value,
        currency: output?.currency?.value,
    });

    const fetchQuotes = useCallback(async () => {
        const formValues = getValues();

        if (previousRequest.current) {
            previousRequest.current.abort('Request was replaced by another one.');
        }

        const request = dispatch(
            sellThunks.handleRequestThunk({
                formValues,
                network,
                shouldSendInSats,
                composeRequestCallback,
            }),
        );
        previousRequest.current = request;

        try {
            const quotes = await request.unwrap();

            analytics.report({
                type: events.tradeReceivedQuotesEvent.name,
                payload: {
                    type: 'sell',
                    count: quotes?.length ?? 0,
                },
            });

            if (quotes) {
                const bestQuote = quotes[0];
                const bestQuotePaymentMethod = bestQuote?.paymentMethod;
                const bestQuotePaymentMethodName =
                    bestQuote?.paymentMethodName ?? bestQuotePaymentMethod;
                const paymentMethodSelected = formValues.paymentMethod?.value;
                const isSelectedPaymentMethodAvailable = quotes.some(
                    quote => quote.paymentMethod === paymentMethodSelected,
                );

                if (!paymentMethodSelected || !isSelectedPaymentMethodAvailable) {
                    setValue(TRADING_FORM_PAYMENT_METHOD_SELECT, {
                        value: bestQuotePaymentMethod ?? '',
                        label: bestQuotePaymentMethodName ?? '',
                    });
                }
            }
        } catch (error) {
            console.warn('Request was aborted:', error instanceof Error ? error.message : error);
        }
    }, [
        dispatch,
        getValues,
        network,
        shouldSendInSats,
        composeRequestCallback,
        analytics,
        setValue,
    ]);

    // Refetch if anything is being typed into the text fields, but debounced. Select fields are not debounced.
    const [debouncedAmountKey, setDebouncedAmountKey] = useState(amountKey);
    useDebounce(() => setDebouncedAmountKey(amountKey), 500, [amountKey]);

    useEffect(() => {
        if (isFetchAllowed) {
            fetchQuotes();
        }
        // Reactivity on combination of fields, using the compouneded keys.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedAmountKey, selectKey, isFetchAllowed]);

    useTradingRefetchScheduler({
        onRefetch: () => {
            if (!isFetchAllowed) {
                return;
            }
            fetchQuotes();
        },
    });

    useEffect(
        () => () => {
            if (previousRequest.current) {
                previousRequest.current.abort('Request is canceled - page is unmounted.');
            }
            dispatch(tradingActions.stopRefetchQuotes());
        },
        [dispatch],
    );
};
