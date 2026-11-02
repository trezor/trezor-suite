import { useCallback, useEffect } from 'react';
import {
    type PerformanceMetrics,
    type PerformanceScore,
    usePerformanceMeasurement,
} from 'react-native-lighthouse';

import { FID_TIMEOUT_MS } from './constants';
import { logPerformanceSample } from './performanceLog';
import { createPerformanceSample } from './performanceSample';
import { type PerformanceScreen, type ScreenPerformance } from './types';

type UseScreenPerformanceParams = {
    screen: PerformanceScreen;
    isReady: boolean;
};

// Imported only by ScreenPerformanceRoot.e2e.tsx, so react-native-lighthouse never reaches a
// non-Detox bundle.
export const useScreenPerformance = ({
    screen,
    isReady,
}: UseScreenPerformanceParams): ScreenPerformance => {
    const handleReport = useCallback(
        (metrics: PerformanceMetrics, score: PerformanceScore) =>
            logPerformanceSample(createPerformanceSample({ screen, metrics, score })),
        [screen],
    );

    const { markInteractive, panResponder } = usePerformanceMeasurement({
        componentName: screen,
        fidTimeout: FID_TIMEOUT_MS,
        debug: false,
        onReport: handleReport,
    });

    useEffect(() => {
        if (isReady) {
            markInteractive();
        }
    }, [isReady, markInteractive]);

    return { markInteractive, panHandlers: panResponder.panHandlers };
};
