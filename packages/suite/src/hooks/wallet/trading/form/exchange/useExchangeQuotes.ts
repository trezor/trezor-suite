import { useEffect, useRef } from 'react';
import { type UseFormReturn, useWatch } from 'react-hook-form';
import { useDispatch } from 'react-redux';

import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { selectAddressValidatorDep } from '@suite-common/address';
import { useServices } from '@suite-common/dependency-injection';
import { useSelector } from '@suite-common/redux-utils';
import {
    TRADING_EXCHANGE_FORM,
    TRADING_EXCHANGE_FORM_CEX,
    TRADING_EXCHANGE_FORM_DEX,
    TRADING_FORM_OUTPUT_AMOUNT,
    TRADING_FORM_RECEIVE_CRYPTO_CURRENCY_SELECT,
    TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT,
    type TradingExchangeFormProps,
    exchangeThunks,
    isReceiveAddressCoherent,
    selectTradingExchangeCexQuotes,
    selectTradingExchangeDexQuotes,
    tradingActions,
    tradingExchangeActions,
} from '@suite-common/trading';
import { type Network, type NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountKey } from '@suite-common/wallet-types';

import { isExchangeQuotesFetchAllowed } from 'src/utils/wallet/trading/exchangeQuotesRequestUtils';

import { useTradingQuoteRequest } from '../common/useTradingQuoteRequest';

type UseExchangeQuotesProps = {
    methods: UseFormReturn<TradingExchangeFormProps>;
    network: Network | undefined;
    shouldSendInSats: boolean | undefined;
    receiveAddress?: string;
    receiveAccountKey?: AccountKey;
    receiveAccountSymbol?: NetworkSymbol;
    composeRequestCallback: () => void;
};

const EXCHANGE_IMMEDIATE_FIELDS = [TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT] as const;

const EXCHANGE_DEBOUNCED_FIELDS = [TRADING_FORM_OUTPUT_AMOUNT] as const;

export const useExchangeQuotes = ({
    methods,
    network,
    shouldSendInSats,
    receiveAddress,
    receiveAccountKey,
    receiveAccountSymbol,
    composeRequestCallback,
}: UseExchangeQuotesProps) => {
    const dispatch = useDispatch();
    const { addressValidator, analytics } = useServices(
        selectAddressValidatorDep,
        selectDesktopAnalyticsDep,
    );

    const dexQuotes = useSelector(selectTradingExchangeDexQuotes);
    const cexQuotes = useSelector(selectTradingExchangeCexQuotes);

    // Subscribe to receiveCryptoSelect so the receiveIdentityKey effect fires on receive-asset changes.
    const receiveCryptoSelect = useWatch({
        control: methods.control,
        name: TRADING_FORM_RECEIVE_CRYPTO_CURRENCY_SELECT,
    });

    const receiveIdentityKey = JSON.stringify({
        receiveCryptoId: receiveCryptoSelect?.id,
        receiveAddress,
        receiveAccountKey,
    });

    const { isScheduledQuotesRefresh, refreshQuotes, abortActiveRequest } = useTradingQuoteRequest({
        methods,
        immediateFields: EXCHANGE_IMMEDIATE_FIELDS,
        debouncedFields: EXCHANGE_DEBOUNCED_FIELDS,
        isFetchAllowed: values => !!network && isExchangeQuotesFetchAllowed(values),
        requestQuotes: values =>
            dispatch(
                exchangeThunks.handleRequestThunk({
                    formValues: { ...values, receiveAddress, receiveAccountKey },
                    network: network!,
                    shouldSendInSats,
                    composeRequestCallback,
                }),
            ),
        stopScheduler: () => dispatch(tradingActions.stopRefetchQuotes()),
        onResolved: quotes => {
            analytics.report({
                type: events.tradeReceivedQuotesEvent.name,
                payload: {
                    type: 'exchange',
                    count: quotes.length,
                },
            });
        },
        isRequestContextAvailable: !!network,
    });

    const previousReceiveIdentityKey = useRef(receiveIdentityKey);
    useEffect(() => {
        if (receiveIdentityKey === previousReceiveIdentityKey.current) {
            return;
        }
        previousReceiveIdentityKey.current = receiveIdentityKey;
        dispatch(tradingExchangeActions.saveSelectedQuote(undefined));

        if (
            !isReceiveAddressCoherent({
                addressValidator,
                receiveAddress,
                receiveCryptoId: receiveCryptoSelect?.id,
                receiveAccountKey,
                receiveAccountSymbol,
            })
        ) {
            abortActiveRequest();

            return;
        }

        refreshQuotes();
    }, [
        receiveIdentityKey,
        receiveAddress,
        receiveCryptoSelect?.id,
        receiveAccountKey,
        receiveAccountSymbol,
        addressValidator,
        dispatch,
        refreshQuotes,
        abortActiveRequest,
    ]);

    const exchangeType = useWatch({ control: methods.control, name: TRADING_EXCHANGE_FORM });

    useEffect(() => {
        const isSelectedDexButFoundOnlyCex =
            exchangeType === TRADING_EXCHANGE_FORM_DEX && !dexQuotes.length && cexQuotes.length;
        const isSelectedCexButFoundOnlyDex =
            exchangeType === TRADING_EXCHANGE_FORM_CEX && dexQuotes.length && !cexQuotes.length;
        const isSelectedDexButNotFoundAny =
            exchangeType === TRADING_EXCHANGE_FORM_DEX && !dexQuotes.length && !cexQuotes.length;

        if (isSelectedDexButFoundOnlyCex) {
            methods.setValue(TRADING_EXCHANGE_FORM, TRADING_EXCHANGE_FORM_CEX);
        } else if (isSelectedCexButFoundOnlyDex) {
            methods.setValue(TRADING_EXCHANGE_FORM, TRADING_EXCHANGE_FORM_DEX);
        } else if (isSelectedDexButNotFoundAny) {
            methods.setValue(TRADING_EXCHANGE_FORM, TRADING_EXCHANGE_FORM_CEX);
        }
    }, [dexQuotes, exchangeType, cexQuotes, methods]);

    return {
        cexQuotes,
        dexQuotes,
        isScheduledQuotesRefresh,
        refreshQuotes,
    };
};
