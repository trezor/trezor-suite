import { type PerformanceScreen, type ScreenPerformance } from './types';

const INERT_SCREEN_PERFORMANCE: ScreenPerformance = {
    markInteractive: () => {},
    panHandlers: {},
};

// Measurement runs only in Detox test builds, where Metro resolves useScreenPerformance.e2e.ts
// instead of this file. Keeping react-native-lighthouse and the readiness selectors out of this
// module is what keeps them out of every other bundle.
export const useScreenPerformance = (
    _screen: PerformanceScreen,
    _isReady?: boolean,
): ScreenPerformance => INERT_SCREEN_PERFORMANCE;
