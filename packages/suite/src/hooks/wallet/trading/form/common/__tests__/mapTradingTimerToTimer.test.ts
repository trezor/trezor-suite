import { mapTradingTimerToTimer } from '../mapTradingTimerToTimer';
import { type TradingTimer } from '../useTradingTimer';

describe('mapTradingTimerToTimer', () => {
    it('maps trading timer shape to legacy timer shape', () => {
        const stop = jest.fn();
        const reset = jest.fn();
        const loading = jest.fn();

        const tradingTimer: TradingTimer = {
            secondsElapsed: 17,
            resetCount: 3,
            isStopped: false,
            isLoading: true,
            stop,
            reset,
            loading,
        };

        const timer = mapTradingTimerToTimer(tradingTimer);

        expect(timer.timeSpent.seconds).toBe(17);
        expect(timer.resetCount).toBe(3);
        expect(timer.isStopped).toBe(false);
        expect(timer.isLoading).toBe(true);
        expect(timer.stop).toBe(stop);
        expect(timer.reset).toBe(reset);
        expect(timer.loading).toBe(loading);
    });
});
