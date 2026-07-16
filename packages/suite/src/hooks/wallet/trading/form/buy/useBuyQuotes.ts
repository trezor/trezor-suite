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
    TRADING_BUY_RECEIVE_ADDRESS,
    TRADING_DEFAULT_CRYPTO_CURRENCY,
    TRADING_FORM_COUNTRY_SELECT,
    TRADING_FORM_COUNTRY_SUBDIVISION_SELECT,
    TRADING_FORM_CRYPTO_CURRENCY_SELECT,
    TRADING_FORM_CRYPTO_INPUT,
    TRADING_FORM_FIAT_CURRENCY_SELECT,
    TRADING_FORM_FIAT_INPUT,
    TRADING_FORM_PAYMENT_METHOD_SELECT,
    type TradingBuyFormProps,
    buyThunks,
    tradingActions,
    useTradingRefetchScheduler,
} from '@suite-common/trading';
import { getNetwork } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';

import { useDispatch } from 'src/hooks/suite';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { isBuyQuotesFetchAllowed } from 'src/utils/wallet/trading/buyQuotesRequestUtils';

type UseBuyQuotesProps = {
    control: Control<TradingBuyFormProps>;
    getValues: UseFormGetValues<TradingBuyFormProps>;
    setValue: UseFormSetValue<TradingBuyFormProps>;
    account: Account;
};

type AbortableRequest = {
    abort: (message?: string) => void;
} | null;

const BUY_QUOTES_KEY_FIELDS = [
    TRADING_FORM_CRYPTO_CURRENCY_SELECT,
    TRADING_FORM_COUNTRY_SELECT,
    TRADING_FORM_COUNTRY_SUBDIVISION_SELECT,
    TRADING_FORM_FIAT_CURRENCY_SELECT,
    TRADING_FORM_FIAT_INPUT,
    TRADING_FORM_CRYPTO_INPUT,
    TRADING_BUY_RECEIVE_ADDRESS,
] as const;

export const useBuyQuotes = ({ control, getValues, setValue, account }: UseBuyQuotesProps) => {
    const dispatch = useDispatch();
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const { isBtcSatsAmountUnit: shouldSendInSats } = useBitcoinAmountUnit(account.symbol);

    const previousRequest = useRef<AbortableRequest>(null);

    // TODO: source control/getValues/setValue via useFormContext() once the trading-form family migrates to FormProvider
    useWatch({ control, name: BUY_QUOTES_KEY_FIELDS });
    const { isValid } = useFormState({ control });

    const values = getValues();
    const isFetchAllowed = isValid && isBuyQuotesFetchAllowed(values);

    const amountKey = JSON.stringify({
        fiatInput: values.fiatInput,
        cryptoInput: values.cryptoInput,
    });
    const selectKey = JSON.stringify({
        cryptoId: values.cryptoSelect?.id,
        country: values.countrySelect?.value,
        countrySubdivision: values.countrySubdivisionSelect?.value,
        currency: values.currencySelect?.value,
        receiveAddress: values.receiveAddress,
    });

    const fetchQuotes = useCallback(async () => {
        const formValues = getValues();
        const network = getNetwork(
            formValues.cryptoSelect?.networkSymbol ?? TRADING_DEFAULT_CRYPTO_CURRENCY,
        );

        if (previousRequest.current) {
            previousRequest.current.abort('Request was replaced by another one.');
        }

        const request = dispatch(
            buyThunks.handleRequestThunk({ formValues, network, shouldSendInSats }),
        );
        previousRequest.current = request;

        try {
            const quotes = await request.unwrap();

            analytics.report({
                type: events.tradeReceivedQuotesEvent.name,
                payload: {
                    type: 'buy',
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
    }, [dispatch, getValues, shouldSendInSats, analytics, setValue]);

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
