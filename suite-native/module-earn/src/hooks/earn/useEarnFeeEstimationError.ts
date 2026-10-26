import { useCallback, useState } from 'react';

export const useEarnFeeEstimationError = (contextKey: string) => {
    const [errorContextKey, setErrorContextKey] = useState<string | null>(null);
    const hasFeeEstimationError = errorContextKey === contextKey;
    const setHasFeeEstimationError = useCallback(
        (hasError: boolean) => setErrorContextKey(hasError ? contextKey : null),
        [contextKey],
    );
    const [feeEstimationRetryKey, setFeeEstimationRetryKey] = useState(0);

    const retryFeeEstimation = useCallback(() => {
        setErrorContextKey(null);
        setFeeEstimationRetryKey(currentKey => currentKey + 1);
    }, []);

    return {
        feeEstimationRetryKey,
        hasFeeEstimationError,
        retryFeeEstimation,
        setHasFeeEstimationError,
    };
};
