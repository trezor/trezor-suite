import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';

type TradingTimerStatus = 'running' | 'loading' | 'stopped';

type TradingTimerState = {
    status: TradingTimerStatus;
    resetCount: number;
};

type TradingTimerAction = { type: 'reset' } | { type: 'stop' } | { type: 'loading' };

const initialState: TradingTimerState = {
    status: 'running',
    resetCount: 0,
};

const tradingTimerReducer = (
    state: TradingTimerState,
    action: TradingTimerAction,
): TradingTimerState => {
    switch (action.type) {
        case 'reset':
            return {
                ...state,
                status: 'running',
                resetCount: state.resetCount + 1,
            };
        case 'stop':
            return {
                ...state,
                status: 'stopped',
            };
        case 'loading':
            return {
                ...state,
                status: 'loading',
            };
        default:
            return state;
    }
};

export type TradingTimer = {
    secondsElapsed: number;
    resetCount: number;
    isStopped: boolean;
    isLoading: boolean;
    stop: () => void;
    reset: () => void;
    loading: () => void;
};

export const useTradingTimer = (): TradingTimer => {
    const [state, dispatch] = useReducer(tradingTimerReducer, initialState);
    const stateRef = useRef(initialState);
    const secondsElapsedRef = useRef(0);

    useEffect(() => {
        stateRef.current = state;
    }, [state]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (stateRef.current.status === 'stopped' || stateRef.current.status === 'loading') {
                return;
            }

            secondsElapsedRef.current += 1;
        }, 1000);

        return () => {
            clearInterval(interval);
        };
    }, []);

    const stop = useCallback(() => {
        dispatch({ type: 'stop' });
    }, []);

    const reset = useCallback(() => {
        secondsElapsedRef.current = 0;
        dispatch({ type: 'reset' });
    }, []);

    const setLoading = useCallback(() => {
        secondsElapsedRef.current = 0;
        dispatch({ type: 'loading' });
    }, []);

    return useMemo(
        () => ({
            get secondsElapsed() {
                return secondsElapsedRef.current;
            },
            resetCount: state.resetCount,
            isStopped: state.status === 'stopped',
            isLoading: state.status === 'loading',
            stop,
            reset,
            loading: setLoading,
        }),
        [state.resetCount, state.status, stop, reset, setLoading],
    );
};
