import { useCallback, useEffect, useState } from 'react';

import { type Timer } from './Timer';

const ZeroTimeSpent = { seconds: 0 } as const;

/**
 * Timer which ticks every X seconds until stopped. Default tick interval is 1 second.
 */
export const useTimer = (timeoutInSeconds: number = 1): Timer => {
    const [timeSpent, setTimeSpent] = useState<{ seconds: number }>(ZeroTimeSpent);
    const [isLoading, setIsLoading] = useState(false);
    const [isStopped, setIsStopped] = useState(false);
    const [resetCount, setResetCount] = useState(0);

    useEffect(() => {
        if (isStopped || isLoading) {
            return () => {};
        }

        const interval = setInterval(() => {
            setTimeSpent(prev => ({ seconds: prev.seconds + timeoutInSeconds }));
        }, timeoutInSeconds * 1000);

        return () => {
            clearInterval(interval);
        };
    }, [isLoading, isStopped, timeoutInSeconds]);

    const reset = useCallback(() => {
        setIsLoading(false);
        setResetCount(prev => prev + 1);
        setTimeSpent(ZeroTimeSpent);
        setIsStopped(false);
    }, []);

    const stop = useCallback(() => {
        setIsStopped(true);
    }, []);

    const loading = useCallback(() => {
        setTimeSpent(ZeroTimeSpent);
        setIsLoading(true);
        setIsStopped(false);
    }, []);

    return {
        timeSpent,
        resetCount,
        isStopped,
        isLoading,
        stop,
        reset,
        loading,
    };
};
