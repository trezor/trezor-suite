import { RefObject, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { isFulfilled } from '@reduxjs/toolkit';
import type { ExchangeTrade } from 'invity-api';

import { invariant } from '@suite-common/suite-utils';
import {
    HandleExchangeRequestThunkProps,
    cryptoIdToNetwork,
    exchangeThunks,
    selectTradingExchangeIsLoading,
} from '@suite-common/trading';
import { WalletSettingsRootState, selectIsAmountInSats } from '@suite-common/wallet-core';
import { EventType, SuiteNativeLegacyAnalyticsEvents } from '@suite-native/analytics';
import { useFormState } from '@suite-native/forms';
import { useLegacyAnalytics } from '@suite-native/services';
import { getSymbolFromTradeableAsset } from '@suite-native/trading-atoms';
import { exchangeActions, selectExchangeQuotes } from '@suite-native/trading-state';
import { AbortablePromise, ExchangeFormType } from '@suite-native/trading-types';
import { Analytics } from '@trezor/analytics';
import { Timer, useDebounce } from '@trezor/react-utils';

import { tradingExchangeFormToTradingExchangeFormProps } from '../../utils/exchange/quotesUtils';
import { useQuotesInvalidator } from '../general/useQuotesInvalidator';
import { useReloadTimer } from '../general/useReloadTimer';

type ShouldFetchExchangeQuotesRef = {
    sendAsset: string | undefined;
    receiveAsset: string | undefined;
    sendCryptoAmount: string | undefined;
    accountDescriptor: string | undefined;
};

const noop = () => {};

const defaultState = {
    sendAsset: undefined,
    receiveAsset: undefined,
    sendCryptoAmount: undefined,
    accountDescriptor: undefined,
} as const;

const useShouldFetchExchangeQuotes = (
    watch: ExchangeFormType['watch'],
    control: ExchangeFormType['control'],
): { isFetchAllowed: boolean; shouldFetchQuotes: boolean } => {
    const prevState = useRef<ShouldFetchExchangeQuotesRef>(defaultState);

    const { isValid } = useFormState({ control });
    if (!isValid) {
        prevState.current = defaultState;

        return {
            isFetchAllowed: false,
            shouldFetchQuotes: false,
        };
    }

    const [sendAsset, receiveAsset, sendCryptoAmount, sendAccount] = watch([
        'sendAsset',
        'receiveAsset',
        'sendCryptoAmount',
        'sendAccount',
    ]);

    const isFetchAllowed =
        !!sendAsset && !!receiveAsset && !!sendCryptoAmount && parseFloat(sendCryptoAmount) > 0;

    if (
        sendAsset?.cryptoId === prevState.current.sendAsset &&
        receiveAsset?.cryptoId === prevState.current.receiveAsset &&
        sendCryptoAmount === prevState.current.sendCryptoAmount &&
        sendAccount?.descriptor === prevState.current.accountDescriptor
    ) {
        return {
            isFetchAllowed,
            shouldFetchQuotes: false,
        };
    }

    prevState.current = {
        sendAsset: sendAsset?.cryptoId,
        receiveAsset: receiveAsset?.cryptoId,
        sendCryptoAmount,
        accountDescriptor: sendAccount?.descriptor,
    };

    return {
        isFetchAllowed,
        shouldFetchQuotes: true,
    };
};

const waitForPromiseAndReport = async (
    promise: AbortablePromise | undefined,
    legacyAnalytics: Analytics<SuiteNativeLegacyAnalyticsEvents>,
) => {
    if (!promise) {
        return;
    }

    const action = await promise;
    if (isFulfilled(action) && (action.payload as ExchangeTrade[]).length > 0) {
        legacyAnalytics.report({
            type: EventType.TradingQuoteReceived,
            payload: {
                type: 'exchange',
            },
        });
    }
};

const useExchangeQuotesThunk = (
    getValues: ExchangeFormType['getValues'],
    timer: Timer,
    shouldRefetchQuotes: boolean,
    quotesPromiseRef: RefObject<AbortablePromise | undefined>,
    debounce: ReturnType<typeof useDebounce>,
) => {
    const legacyAnalytics = useLegacyAnalytics();
    const dispatch = useDispatch();
    const asset = getValues('sendAsset');
    const symbol = getSymbolFromTradeableAsset(asset);
    const shouldSendInSats = useSelector((state: WalletSettingsRootState) =>
        selectIsAmountInSats(state, symbol),
    );

    useEffect(() => {
        if (shouldRefetchQuotes) {
            if (quotesPromiseRef.current?.abort) {
                quotesPromiseRef.current.abort('Request was replaced by another one.');
            }

            debounce(() => {
                const selectedAsset = getValues('sendAsset');
                invariant(selectedAsset, 'Asset is not defined');
                const network = cryptoIdToNetwork(selectedAsset.cryptoId);
                invariant(network, `Network not found for [${selectedAsset.cryptoId}]`);

                const payload: HandleExchangeRequestThunkProps = {
                    formValues: tradingExchangeFormToTradingExchangeFormProps(getValues),
                    network,
                    timer,
                    shouldSendInSats,
                    composeRequestCallback: noop,
                };

                quotesPromiseRef.current = dispatch(exchangeThunks.handleRequestThunk(payload));
                waitForPromiseAndReport(quotesPromiseRef.current, legacyAnalytics);
            });
        }
    }, [
        dispatch,
        getValues,
        shouldRefetchQuotes,
        timer,
        quotesPromiseRef,
        debounce,
        shouldSendInSats,
        legacyAnalytics,
    ]);
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

export const useExchangeQuotes = ({ watch, getValues, control }: ExchangeFormType) => {
    const debounce = useDebounce();
    const promiseRef = useRef<AbortablePromise | undefined>(undefined);

    const { isFetchAllowed, shouldFetchQuotes } = useShouldFetchExchangeQuotes(watch, control);

    const { timer, shouldReload } = useReloadTimer({ isEnabled: isFetchAllowed });

    useExchangeQuotesInvalidator(isFetchAllowed, promiseRef, debounce);
    useExchangeQuotesThunk(
        getValues,
        timer,
        isFetchAllowed && (shouldFetchQuotes || shouldReload),
        promiseRef,
        debounce,
    );

    return {
        timer,
        quotesRequest: promiseRef.current,
    };
};
