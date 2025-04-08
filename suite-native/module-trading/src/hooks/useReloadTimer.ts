import { INVITY_API_RELOAD_QUOTES_AFTER_SECONDS } from '@suite-common/trading';
import { useTimer } from '@trezor/react-utils';

export const MAX_RESET_COUNT = 40;

export const useReloadTimer = () => {
    const timer = useTimer();

    if (timer.isStopped || timer.isLoading) {
        return {
            timer,
            shouldReload: false,
        };
    }

    if (timer.resetCount >= MAX_RESET_COUNT) {
        timer.stop();
    }

    const shouldReload = timer.timeSpent.seconds >= INVITY_API_RELOAD_QUOTES_AFTER_SECONDS;

    return {
        timer,
        shouldReload,
    };
};
