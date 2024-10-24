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
    const [timestamp, setTimestamp] = useState(Date.now());
    const [timeSpend, setTimeSpend] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isStopped, setIsStopped] = useState(false);
    const [resetCount, setResetCount] = useState(0);

    useEffect(() => {
        if (isStopped || isLoading) {
            return;
        }

        const interval = setInterval(() => {
            const dateNow = Date.now();

            if (timestamp + 1000 <= dateNow) {
                setTimestamp(timestamp + 1000);
                setTimeSpend(prevTime => prevTime + 1000);
            }
        }, 10);

        return () => {
            clearInterval(interval);
        };
    }, [isLoading, isStopped, timestamp]);

    const reset = () => {
        setIsLoading(false);
        setResetCount(resetCount + 1);
        setTimeSpend(0);
        setTimestamp(Date.now());
        setIsStopped(false);
    };

    const stop = () => {
        setIsStopped(true);
    };

    const loading = () => {
        setTimeSpend(0);
        setTimestamp(Date.now());
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
