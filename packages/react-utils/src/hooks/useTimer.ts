import { useCallback, useEffect, useRef, useState } from 'react';

export interface Timer {
    timeSpent: {
        seconds: number;
    };
    resetCount: number;
    isStopped: boolean;
    isLoading: boolean;
    stop: () => void;
    reset: () => void;
    loading: () => void;
}

export const useTimer = (): Timer => {
    const [timeSpent, setTimeSpent] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isStopped, setIsStopped] = useState(false);
    const [resetCount, setResetCount] = useState(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (isStopped || isLoading) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }

            return;
        }

        intervalRef.current = setInterval(() => {
            setTimeSpent(prevTime => prevTime + 1);
        }, 1000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isLoading, isStopped]);

    const reset = useCallback(() => {
        setIsLoading(false);
        setResetCount(prev => prev + 1);
        setTimeSpent(0);
        setIsStopped(false);
    }, []);

    const stop = useCallback(() => {
        setIsStopped(true);
    }, []);

    const loading = useCallback(() => {
        setTimeSpent(0);
        setIsLoading(true);
        setIsStopped(false);
    }, []);

    return {
        timeSpent: { seconds: timeSpent },
        resetCount,
        isStopped,
        isLoading,
        stop,
        reset,
        loading,
    };
};
