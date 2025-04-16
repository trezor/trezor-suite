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

    if (isEnabled && isStopped && !isLoading && resetCount < MAX_RESET_COUNT) {
        reset();
    }

    if ((!isEnabled && !isStopped) || resetCount >= MAX_RESET_COUNT) {
        stop();

        return {
            timer,
            shouldReload: false,
        };
    }

    if (isStopped || isLoading) {
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
