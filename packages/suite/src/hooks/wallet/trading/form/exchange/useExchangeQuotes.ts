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
    TRADING_EXCHANGE_FORM,
    TRADING_EXCHANGE_FORM_CEX,
    TRADING_EXCHANGE_FORM_DEX,
    TRADING_FORM_OUTPUT_AMOUNT,
    TRADING_FORM_RECEIVE_CRYPTO_CURRENCY_SELECT,
    TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT,
    type TradingExchangeFormProps,
    exchangeThunks,
    selectTradingExchangeCexQuotes,
    selectTradingExchangeDexQuotes,
    tradingActions,
    tradingExchangeActions,
    useTradingRefetchScheduler,
} from '@suite-common/trading';
import { type Network } from '@suite-common/wallet-config';
import { type AccountKey } from '@suite-common/wallet-types';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { isExchangeQuotesFetchAllowed } from 'src/utils/wallet/trading/exchangeQuotesRequestUtils';

type UseExchangeQuotesProps = {
    control: Control<TradingExchangeFormProps>;
    getValues: UseFormGetValues<TradingExchangeFormProps>;
    setValue: UseFormSetValue<TradingExchangeFormProps>;
    network: Network | undefined;
    shouldSendInSats: boolean | undefined;
    // receiveAddress and receiveAccountKey are read from useTradingReceiveAddress
    // rather than mirrored onto the outer form, keeping the receive identity a
    // single source of truth (#28143).
    receiveAddress?: string;
    receiveAccountKey?: AccountKey;
    composeRequestCallback: () => void;
};

type AbortableRequest = {
    abort: (message?: string) => void;
} | null;

const EXCHANGE_QUOTES_KEY_FIELDS = [
    TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT,
    TRADING_FORM_RECEIVE_CRYPTO_CURRENCY_SELECT,
    TRADING_EXCHANGE_FORM,
    TRADING_FORM_OUTPUT_AMOUNT,
] as const;

export const useExchangeQuotes = ({
    control,
    getValues,
    setValue,
    network,
    shouldSendInSats,
    receiveAddress,
    receiveAccountKey,
    composeRequestCallback,
}: UseExchangeQuotesProps) => {
    const dispatch = useDispatch();
    const { analytics } = useServices(selectDesktopAnalyticsDep);

    const previousRequest = useRef<AbortableRequest>(null);

    const dexQuotes = useSelector(selectTradingExchangeDexQuotes);
    const cexQuotes = useSelector(selectTradingExchangeCexQuotes);

    // used for disabling approve/revoke controls when
    // quotes are scheduled to refresh after changing swap form inputs
    const [isScheduledQuotesRefresh, setIsScheduledQuotesRefresh] = useState(false);

    // TODO: source control/getValues/setValue via useFormContext() once the trading-form family migrates to FormProvider
    useWatch({ control, name: EXCHANGE_QUOTES_KEY_FIELDS });
    const { isValid } = useFormState({ control });

    const values = getValues();
    const { exchangeType } = values;
    const isFetchAllowed = isValid && isExchangeQuotesFetchAllowed(values);

    const amountKey = JSON.stringify({
        amount: values.outputs?.[0]?.amount,
    });
    const selectKey = JSON.stringify({
        sendCryptoId: values.sendCryptoSelect?.id,
        sendAccountKey: values.sendCryptoSelect?.accountKey,
        receiveCryptoId: values.receiveCryptoSelect?.id,
        exchangeType,
        receiveAddress,
        receiveAccountKey,
    });
    const receiveIdentityKey = JSON.stringify({
        receiveCryptoId: values.receiveCryptoSelect?.id,
        receiveAddress,
    });

    const fetchQuotes = useCallback(async () => {
        if (!network) {
            setIsScheduledQuotesRefresh(false);

            return;
        }
        const formValues = getValues();

        if (previousRequest.current) {
            previousRequest.current.abort('Request was replaced by another one.');
        }

        const request = dispatch(
            exchangeThunks.handleRequestThunk({
                formValues: {
                    ...formValues,
                    receiveAddress,
                    receiveAccountKey,
                },
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
                    type: 'exchange',
                    count: quotes?.length ?? 0,
                },
            });
        } catch (error) {
            console.warn('Request was aborted:', error instanceof Error ? error.message : error);
        }

        setIsScheduledQuotesRefresh(false);
    }, [
        dispatch,
        getValues,
        receiveAddress,
        receiveAccountKey,
        network,
        shouldSendInSats,
        composeRequestCallback,
        analytics,
    ]);

    // Refetch if anything is being typed into the text fields, but debounced. Select fields are not debounced.
    const [debouncedAmountKey, setDebouncedAmountKey] = useState(amountKey);
    useDebounce(() => setDebouncedAmountKey(amountKey), 500, [amountKey]);

    // Clear the stale selected quote whenever the receive identity changes, before
    // the refetch fires below (the #28143/#28357 rapid-switch family).
    const previousReceiveIdentityKey = useRef(receiveIdentityKey);
    useEffect(() => {
        if (receiveIdentityKey === previousReceiveIdentityKey.current) {
            return;
        }
        previousReceiveIdentityKey.current = receiveIdentityKey;
        dispatch(tradingExchangeActions.saveSelectedQuote(undefined));
    }, [receiveIdentityKey, dispatch]);

    useEffect(() => {
        if (isFetchAllowed) {
            fetchQuotes();
        }
        // Reactivity on combination of fields, using the compounded keys.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedAmountKey, selectKey, isFetchAllowed]);

    // handle edge case when there are no longer quotes of selected exchange type
    useEffect(() => {
        const isSelectedDexButFoundOnlyCex =
            exchangeType === TRADING_EXCHANGE_FORM_DEX && !dexQuotes.length && cexQuotes.length;
        const isSelectedCexButFoundOnlyDex =
            exchangeType === TRADING_EXCHANGE_FORM_CEX && dexQuotes.length && !cexQuotes.length;
        const isSelectedDexButNotFoundAny =
            exchangeType === TRADING_EXCHANGE_FORM_DEX && !dexQuotes.length && !cexQuotes.length;

        if (isSelectedDexButFoundOnlyCex) {
            setValue(TRADING_EXCHANGE_FORM, TRADING_EXCHANGE_FORM_CEX);
        } else if (isSelectedCexButFoundOnlyDex) {
            setValue(TRADING_EXCHANGE_FORM, TRADING_EXCHANGE_FORM_DEX);
        } else if (isSelectedDexButNotFoundAny) {
            setValue(TRADING_EXCHANGE_FORM, TRADING_EXCHANGE_FORM_CEX);
        }
    }, [dexQuotes, exchangeType, cexQuotes, setValue]);

    const onBeforeRefetch = useCallback(() => {
        setIsScheduledQuotesRefresh(true);
    }, []);

    useTradingRefetchScheduler({
        onRefetch: () => {
            if (!isFetchAllowed) {
                return;
            }
            fetchQuotes();
        },
        onBeforeRefetch,
    });

    useEffect(() => {
        if (!network && previousRequest.current) {
            previousRequest.current.abort('Request is canceled - network is no longer available.');
            previousRequest.current = null;
            setIsScheduledQuotesRefresh(false);
        }
    }, [network]);

    useEffect(
        () => () => {
            if (previousRequest.current) {
                previousRequest.current.abort('Request is canceled - page is unmounted.');
            }
            dispatch(tradingActions.stopRefetchQuotes());
        },
        [dispatch],
    );

    const resetSelectedOffer = useCallback(() => {
        setIsScheduledQuotesRefresh(true);
    }, []);

    return {
        cexQuotes,
        dexQuotes,
        isScheduledQuotesRefresh,
        resetSelectedOffer,
        refreshQuotes: fetchQuotes,
    };
};
