import { type Timer } from '@trezor/react-utils';

import { type TradingTimer } from './useTradingTimer';

export const mapTradingTimerToTimer = (timer: TradingTimer): Timer => {
    if (!timer) {
        throw new Error('mapTradingTimerToTimer: timer parameter is required');
    }

    return {
        timeSpent: {
            seconds: timer.secondsElapsed ?? 0,
        },
        resetCount: timer.resetCount,
        isStopped: timer.isStopped,
        isLoading: timer.isLoading,
        stop: timer.stop,
        reset: timer.reset,
        loading: timer.loading,
    };
};
