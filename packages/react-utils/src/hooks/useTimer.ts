import { useEffect, useState, useRef } from 'react';

export interface Timer {
    timeSpend: {
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
    const [timeSpend, setTimeSpend] = useState(0);
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
            setTimeSpend(prevTime => prevTime + 1000);
        }, 1000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isLoading, isStopped]);

    const reset = () => {
        setIsLoading(false);
        setResetCount(prev => prev + 1);
        setTimeSpend(0);
        setIsStopped(false);
    };

    const stop = () => {
        setIsStopped(true);
    };

    const loading = () => {
        setTimeSpend(0);
        setIsLoading(true);
        setIsStopped(false);
    };

    return {
        timeSpend: {
            seconds: timeSpend / 1000,
        },
        resetCount,
        isStopped,
        isLoading,
        stop,
        reset,
        loading,
    };
};
