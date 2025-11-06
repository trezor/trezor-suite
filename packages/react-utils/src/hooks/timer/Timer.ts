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
