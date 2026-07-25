import { useCallback, useEffect, useRef, useState } from 'react';
import { type FieldPath, type FieldValues, type UseFormReturn } from 'react-hook-form';

import { useTradingRefetchScheduler } from '@suite-common/trading';
import { useCurrentRef } from '@trezor/react-utils';

const DEBOUNCE_DELAY_MS = 500;

type AbortableRequest<TResult> = {
    abort: () => void;
    unwrap: () => Promise<TResult>;
};

type UseTradingQuoteRequestProps<TFormProps extends FieldValues, TResult> = {
    methods: UseFormReturn<TFormProps>;
    immediateFields: readonly FieldPath<TFormProps>[];
    debouncedFields: readonly FieldPath<TFormProps>[];
    isFetchAllowed: (values: TFormProps) => boolean;
    requestQuotes: (values: TFormProps) => AbortableRequest<TResult>;
    stopScheduler: () => void;
    onResolved?: (result: TResult, values: TFormProps) => void;
    isRequestContextAvailable?: boolean;
};

export const useTradingQuoteRequest = <TFormProps extends FieldValues, TResult>({
    methods,
    isRequestContextAvailable = true,
    ...config
}: UseTradingQuoteRequestProps<TFormProps, TResult>) => {
    const controllerRef = useRef<AbortController | null>(null);
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isQuoteLifecycleActive = useRef(false);

    const [isScheduledQuotesRefresh, setIsScheduledQuotesRefresh] = useState(false);

    const configRef = useCurrentRef(config);

    const abortActiveRequest = useCallback(() => {
        controllerRef.current?.abort();
        controllerRef.current = null;
        setIsScheduledQuotesRefresh(false);
    }, []);

    const clearDebounceTimer = useCallback(() => {
        if (debounceTimer.current !== null) {
            clearTimeout(debounceTimer.current);
            debounceTimer.current = null;
        }
    }, []);

    const stopQuoteRequests = useCallback(() => {
        abortActiveRequest();
        clearDebounceTimer();
        setIsScheduledQuotesRefresh(false);

        if (!isQuoteLifecycleActive.current) {
            return;
        }

        isQuoteLifecycleActive.current = false;
        configRef.current.stopScheduler();
    }, [abortActiveRequest, clearDebounceTimer, configRef]);

    const refreshQuotes = useCallback(async () => {
        const values = methods.getValues();

        if (!configRef.current.isFetchAllowed(values)) {
            stopQuoteRequests();

            return;
        }

        controllerRef.current?.abort();
        const controller = new AbortController();
        controllerRef.current = controller;
        const { signal } = controller;

        const isValid = await methods.trigger();

        if (signal.aborted) {
            return;
        }

        if (!isValid) {
            stopQuoteRequests();

            return;
        }

        const currentValues = methods.getValues();

        setIsScheduledQuotesRefresh(true);

        const request = configRef.current.requestQuotes(currentValues);
        signal.addEventListener('abort', () => request.abort(), { once: true });
        isQuoteLifecycleActive.current = true;

        try {
            const result = await request.unwrap();

            if (signal.aborted) {
                return;
            }

            configRef.current.onResolved?.(result, currentValues);
            setIsScheduledQuotesRefresh(false);
        } catch {
            if (!signal.aborted) {
                setIsScheduledQuotesRefresh(false);
            }
        }
    }, [methods, configRef, stopQuoteRequests]);

    useTradingRefetchScheduler({
        onRefetch: () => {
            if (configRef.current.isFetchAllowed(methods.getValues())) {
                refreshQuotes();
            }
        },
    });

    useEffect(() => {
        const subscription = methods.watch((_, { name }) => {
            if (!name) {
                return;
            }

            const { immediateFields, debouncedFields, isFetchAllowed } = configRef.current;
            const isImmediate = immediateFields.includes(name);

            if (!isImmediate && !debouncedFields.includes(name)) {
                return;
            }

            abortActiveRequest();

            if (!isFetchAllowed(methods.getValues())) {
                stopQuoteRequests();

                return;
            }

            setIsScheduledQuotesRefresh(true);
            clearDebounceTimer();

            if (isImmediate) {
                refreshQuotes();
            } else {
                debounceTimer.current = setTimeout(() => {
                    refreshQuotes();
                }, DEBOUNCE_DELAY_MS);
            }
        });

        return () => subscription.unsubscribe();
    }, [
        methods,
        configRef,
        abortActiveRequest,
        clearDebounceTimer,
        stopQuoteRequests,
        refreshQuotes,
    ]);

    // Runs on mount too — a form mounted already valid (e.g. buy redirect) fetches immediately.
    useEffect(() => {
        if (isRequestContextAvailable) {
            refreshQuotes();
        } else {
            stopQuoteRequests();
        }
    }, [isRequestContextAvailable, stopQuoteRequests, refreshQuotes]);

    useEffect(
        () => () => {
            stopQuoteRequests();
        },
        [stopQuoteRequests],
    );

    return {
        isScheduledQuotesRefresh,
        refreshQuotes,
        abortActiveRequest,
    };
};
