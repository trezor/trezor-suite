import { useEffect, useState } from 'react';

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

    useEffect(() => {
        const timeout = setTimeout(() => {
            setTimeSpend(timeSpend + 1000);
        }, 1000);

        if (isStopped || isLoading) {
            clearTimeout(timeout);
        }

        return () => {
            clearTimeout(timeout);
        };
    });

    const reset = () => {
        setIsLoading(false);
        setResetCount(resetCount + 1);
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
