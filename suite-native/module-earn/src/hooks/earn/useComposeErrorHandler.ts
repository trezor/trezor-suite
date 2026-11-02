import { useCallback, useRef } from 'react';

type UseComposeErrorHandlerParams<TReason extends string> = {
    contextKey: string;
    onError?: (reason: TReason) => void;
};

export const useComposeErrorHandler = <TReason extends string>({
    contextKey,
    onError,
}: UseComposeErrorHandlerParams<TReason>) => {
    const onErrorRef = useRef(onError);
    onErrorRef.current = onError;
    const previousErrorRef = useRef<{ contextKey: string; reason: TReason } | null>(null);

    const reportError = useCallback(
        (reason: TReason) => {
            const previous = previousErrorRef.current;

            if (previous?.contextKey === contextKey && previous.reason === reason) return;

            previousErrorRef.current = { contextKey, reason };
            onErrorRef.current?.(reason);
        },
        [contextKey],
    );

    const resetError = useCallback(() => {
        previousErrorRef.current = null;
    }, []);

    return { reportError, resetError };
};
