import { type RefObject, useCallback, useEffect, useEffectEvent, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { isFulfilled } from '@reduxjs/toolkit';
import type { ExchangeTrade } from 'invity-api';

import { useServices } from '@suite-common/dependency-injection';
import { invariant } from '@suite-common/suite-utils';
import {
    type HandleExchangeRequestThunkProps,
    cryptoIdToNetwork,
    exchangeThunks,
    selectTradingExchangeIsLoading,
    useTradingRefetchScheduler,
} from '@suite-common/trading';
import { type WalletSettingsRootState, selectIsAmountInSats } from '@suite-common/wallet-core';
import {
    type AnalyticsNativeEvents,
    events,
    selectNativeAnalyticsDep,
} from '@suite-native/analytics';
import { useFormState, useWatch } from '@suite-native/forms';
import { getSymbolFromTradeableAsset } from '@suite-native/trading-atoms';
import { exchangeActions, selectExchangeQuotes } from '@suite-native/trading-state';
import { type AbortablePromise, type ExchangeFormType } from '@suite-native/trading-types';
import { type Analytics } from '@trezor/analytics-uploader';
import { useDebounce } from '@trezor/react-utils';
import { noop } from '@trezor/utils';

import { tradingExchangeFormToTradingExchangeFormProps } from '../../utils/exchange/quotesUtils';
import { getReceiveAccountAddressText } from '../../utils/general/receiveAccountUtils';
import { useQuotesInvalidator } from '../general/useQuotesInvalidator';

type ExchangeQuoteRequestState = {
    isFetchAllowed: boolean;
    sendAsset: string | undefined;
    receiveAsset: string | undefined;
    sendCryptoAmount: string | undefined;
    sendAccountDescriptor: string | undefined;
    receiveAccountAddress: string | undefined;
};

const useExchangeQuoteRequestState = (
    control: ExchangeFormType['control'],
): ExchangeQuoteRequestState => {
    const [sendAsset, receiveAsset, sendCryptoAmount, sendAccount, receiveAccount] = useWatch({
        control,
        name: ['sendAsset', 'receiveAsset', 'sendCryptoAmount', 'sendAccount', 'receiveAccount'],
    });
    const { isValid } = useFormState({ control });

    const isFetchAllowed =
        isValid &&
        !!sendAsset &&
        !!receiveAsset &&
        !!sendCryptoAmount &&
        parseFloat(sendCryptoAmount) > 0;

    const receiveAccountAddress = getReceiveAccountAddressText(receiveAccount);

    return {
        isFetchAllowed,
        sendAsset: sendAsset?.cryptoId,
        receiveAsset: receiveAsset?.cryptoId,
        sendCryptoAmount,
        sendAccountDescriptor: sendAccount?.descriptor,
        receiveAccountAddress,
    };
};

const waitForPromiseAndReport = async (
    promise: AbortablePromise | undefined,
    analytics: Analytics<AnalyticsNativeEvents>,
) => {
    if (!promise) {
        return;
    }

    const action = await promise;
    if (isFulfilled(action) && (action.payload as ExchangeTrade[]).length > 0) {
        analytics.report({
            type: events.tradingQuoteReceivedEvent.name,
            payload: {
                type: 'exchange',
            },
        });
    }
};

const useExchangeQuotesThunk = (
    { getValues, control }: ExchangeFormType,
    requestState: ExchangeQuoteRequestState,
    quotesPromiseRef: RefObject<AbortablePromise | undefined>,
    debounce: ReturnType<typeof useDebounce>,
) => {
    const { analytics } = useServices(selectNativeAnalyticsDep);
    const dispatch = useDispatch();
    const asset = useWatch({ control, name: 'sendAsset' });
    const symbol = getSymbolFromTradeableAsset(asset);
    const shouldSendInSats = useSelector((state: WalletSettingsRootState) =>
        selectIsAmountInSats(state, symbol),
    );
    const {
        isFetchAllowed,
        sendAsset,
        receiveAsset,
        sendCryptoAmount,
        sendAccountDescriptor,
        receiveAccountAddress,
    } = requestState;

    const fetchQuotes = useCallback(async () => {
        const selectedAsset = getValues('sendAsset');
        invariant(selectedAsset, 'Asset is not defined');
        const network = cryptoIdToNetwork(selectedAsset.cryptoId);
        invariant(network, `Network not found for [${selectedAsset.cryptoId}]`);

        const payload: HandleExchangeRequestThunkProps = {
            formValues: tradingExchangeFormToTradingExchangeFormProps(getValues),
            network,
            shouldSendInSats,
            composeRequestCallback: noop,
        };

        quotesPromiseRef.current = dispatch(exchangeThunks.handleRequestThunk(payload));
        await waitForPromiseAndReport(quotesPromiseRef.current, analytics);
    }, [getValues, shouldSendInSats, quotesPromiseRef, dispatch, analytics]);

    const requestQuotes = useEffectEvent(() => {
        if (quotesPromiseRef.current?.abort) {
            quotesPromiseRef.current.abort('Request was replaced by another one.');
        }

        debounce(fetchQuotes);
    });

    useEffect(() => {
        if (!isFetchAllowed) {
            return;
        }

        requestQuotes();
    }, [
        isFetchAllowed,
        sendAsset,
        receiveAsset,
        sendCryptoAmount,
        sendAccountDescriptor,
        receiveAccountAddress,
    ]);

    useTradingRefetchScheduler({
        onRefetch: () => {
            if (!isFetchAllowed) return;
            debounce(fetchQuotes);
        },
    });
};

const useExchangeQuotesInvalidator = (
    isFormValid: boolean,
    quotesPromiseRef: RefObject<AbortablePromise | undefined>,
    debounce: ReturnType<typeof useDebounce>,
) => {
    const quotes = useSelector(selectExchangeQuotes);
    const isLoading = useSelector(selectTradingExchangeIsLoading);

    useQuotesInvalidator({
        isFormValid,
        isLoading,
        anyQuotesLoaded: quotes.length > 0,
        quotesPromiseRef,
        debounce,
        getClearRequestAction: exchangeActions.clearQuotesAndQuotesRequest,
        getClearStateAction: exchangeActions.clearState,
    });
};

export const useExchangeQuotes = (form: ExchangeFormType) => {
    const debounce = useDebounce();
    const promiseRef = useRef<AbortablePromise | undefined>(undefined);

    const requestState = useExchangeQuoteRequestState(form.control);

    useExchangeQuotesInvalidator(requestState.isFetchAllowed, promiseRef, debounce);
    useExchangeQuotesThunk(form, requestState, promiseRef, debounce);
};
