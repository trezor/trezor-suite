import { type ReactNode } from 'react';
import { type GestureResponderHandlers } from 'react-native';

export type PerformanceScreen = 'home' | 'accounts' | 'account-detail' | 'send' | 'receive';

export type PerformanceSample = {
    screen: PerformanceScreen;
    ttffMs: number | null;
    ttiMs: number | null;
    fidMs: number | null;
    score: number | null;
    timestamp: number;
};

export type ScreenPerformance = {
    markInteractive: () => void;
    panHandlers: Partial<GestureResponderHandlers>;
};

export type ScreenPerformanceRootProps = {
    panHandlers: ScreenPerformance['panHandlers'];
    children: ReactNode;
};
