import { useEffect } from 'react';

import { INVITY_API_RELOAD_QUOTES_AFTER_SECONDS } from '@suite-common/trading';
import { useTimer } from '@trezor/react-utils';

export const MAX_RESET_COUNT = 40;

export const useReloadTimer = (isEnabled: boolean) => {
    const timer = useTimer();
    const {
        timeSpent: { seconds },
        resetCount,
        isStopped,
        isLoading,
        stop,
        reset,
    } = timer;

    useEffect(() => {
        if (isEnabled && isStopped && !isLoading && resetCount < MAX_RESET_COUNT) {
            reset();
        }

        if ((!isEnabled && !isStopped) || resetCount >= MAX_RESET_COUNT) {
            stop();
        }
    }, [isEnabled, isStopped, isLoading, resetCount, reset, stop]);

    if (isStopped || isLoading || !isEnabled) {
        return {
            timer,
            shouldReload: false,
        };
    }

    const shouldReload = seconds >= INVITY_API_RELOAD_QUOTES_AFTER_SECONDS;

    return {
        timer,
        shouldReload,
    };
};
