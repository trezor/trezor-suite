import { useEffect, useEffectEvent, useRef } from 'react';

import { useIsFocused } from '@react-navigation/native';
import { type ActionCreatorWithoutPayload, isFulfilled } from '@reduxjs/toolkit';

import { useTradingRefetchScheduler } from '@suite-common/trading';
import { type AbortablePromise } from '@suite-native/trading-types';
import { useDebounce } from '@trezor/react-utils';
import { noop } from '@trezor/utils';

import { useQuotesInvalidator } from './useQuotesInvalidator';

type QuotesRequestKeyParams = Record<string, string | boolean | undefined>;

export type UseQuotesRequestParams = {
    requestKey: string | undefined;
    fetchQuotes: () => AbortablePromise | undefined;
    onQuotesReceived?: () => void;
    isLoading: boolean;
    hasQuotes: boolean;
    clearQuotesAction: ActionCreatorWithoutPayload;
    clearStateAction: ActionCreatorWithoutPayload;
};

export const getQuotesRequestKey = (
    isFetchAllowed: boolean,
    params: QuotesRequestKeyParams,
): string | undefined => (isFetchAllowed ? JSON.stringify(params) : undefined);

const hasReceivedQuotes = (action: unknown) =>
    isFulfilled(action) && Array.isArray(action.payload) && action.payload.length > 0;

export const useQuotesRequest = ({
    requestKey,
    fetchQuotes,
    onQuotesReceived,
    isLoading,
    hasQuotes,
    clearQuotesAction,
    clearStateAction,
}: UseQuotesRequestParams) => {
    const debounce = useDebounce();
    const isScreenFocused = useIsFocused();
    const quotesPromiseRef = useRef<AbortablePromise | undefined>(undefined);
    const wasBlurredRef = useRef(false);
    const isFetchAllowed = requestKey !== undefined;

    useQuotesInvalidator({
        isFormValid: isFetchAllowed,
        isLoading,
        anyQuotesLoaded: hasQuotes,
        quotesPromiseRef,
        debounce,
        getClearRequestAction: clearQuotesAction,
        getClearStateAction: clearStateAction,
    });

    const runQuotesRequest = async () => {
        const quotesPromise = fetchQuotes();
        quotesPromiseRef.current = quotesPromise;

        if (!quotesPromise || !onQuotesReceived) {
            return;
        }

        const action = await quotesPromise;
        if (hasReceivedQuotes(action)) {
            onQuotesReceived();
        }
    };

    const abortQuotesRequest = (reason: string) => {
        if (quotesPromiseRef.current?.abort) {
            quotesPromiseRef.current.abort(reason);
        }
    };

    const requestQuotes = useEffectEvent((shouldFetchImmediately: boolean) => {
        abortQuotesRequest('Request was replaced by another one.');

        if (shouldFetchImmediately) {
            runQuotesRequest();
        } else {
            debounce(runQuotesRequest);
        }
    });

    const cancelQuotesRequest = useEffectEvent(() => {
        debounce(noop);
        abortQuotesRequest('Screen lost focus.');
    });

    useEffect(() => {
        if (!isScreenFocused) {
            wasBlurredRef.current = true;
            cancelQuotesRequest();

            return;
        }

        const shouldFetchImmediately = wasBlurredRef.current;
        wasBlurredRef.current = false;

        if (requestKey === undefined) {
            return;
        }

        requestQuotes(shouldFetchImmediately);
    }, [requestKey, isScreenFocused]);

    useTradingRefetchScheduler({
        onRefetch: () => {
            if (!isFetchAllowed || !isScreenFocused) {
                return;
            }
            debounce(runQuotesRequest);
        },
    });
};
