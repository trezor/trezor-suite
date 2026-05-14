import { type RefObject, useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { type ActionCreatorWithoutPayload } from '@reduxjs/toolkit';

import { type AbortablePromise } from '@suite-native/trading-types';
import { type useDebounce } from '@trezor/react-utils';

export type UseQuotesInvalidatorProps = {
    isFormValid: boolean;
    isLoading: boolean;
    anyQuotesLoaded: boolean;
    quotesPromiseRef: RefObject<AbortablePromise | undefined>;
    debounce: ReturnType<typeof useDebounce>;
    getClearRequestAction: ActionCreatorWithoutPayload;
    getClearStateAction: ActionCreatorWithoutPayload;
};

export const useQuotesInvalidator = ({
    isFormValid,
    isLoading,
    anyQuotesLoaded,
    quotesPromiseRef,
    debounce,
    getClearRequestAction,
    getClearStateAction,
}: UseQuotesInvalidatorProps) => {
    const dispatch = useDispatch();

    const shouldClearDebounceCallback = !isFormValid;
    const shouldAbortQuotesRequest = !isFormValid && isLoading;
    const shouldInvalidateQuotes = !isFormValid && anyQuotesLoaded;

    // make sure that no debounced quotes request is pending when form is invalid
    useEffect(() => {
        if (shouldClearDebounceCallback) {
            debounce(() => {});
        }
    }, [shouldClearDebounceCallback, debounce]);

    // make sure no quotes request is pending when form is invalid
    useEffect(() => {
        if (shouldAbortQuotesRequest && quotesPromiseRef.current?.abort) {
            quotesPromiseRef.current.abort('Invalidating quotes');
        }
    }, [shouldAbortQuotesRequest, quotesPromiseRef]);

    // make sure no stale quotes are present when form is invalid
    useEffect(() => {
        if (shouldInvalidateQuotes) {
            dispatch(getClearRequestAction());
        }
    }, [shouldInvalidateQuotes, dispatch, getClearRequestAction]);

    useEffect(
        // on form unmount
        () => () => {
            // make sure no quotes request is pending
            if (quotesPromiseRef.current?.abort) {
                quotesPromiseRef.current.abort('Component unmounted');
            }
            // clear whole trading state for this flow, including quotes
            dispatch(getClearStateAction());
            // debounce should be handled by useDebounce, no need to clear it here
        },
        [dispatch, quotesPromiseRef, getClearStateAction],
    );
};
