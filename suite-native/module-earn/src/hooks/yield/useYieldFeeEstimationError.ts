import { useCallback, useState } from 'react';

export const useYieldFeeEstimationError = () => {
    const [hasFeeEstimationError, setHasFeeEstimationError] = useState(false);
    const [feeEstimationRetryKey, setFeeEstimationRetryKey] = useState(0);

    const retryFeeEstimation = useCallback(() => {
        setHasFeeEstimationError(false);
        setFeeEstimationRetryKey(currentKey => currentKey + 1);
    }, []);

    return {
        feeEstimationRetryKey,
        hasFeeEstimationError,
        retryFeeEstimation,
        setHasFeeEstimationError,
    };
};
