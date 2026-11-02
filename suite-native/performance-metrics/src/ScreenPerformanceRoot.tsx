import { type ScreenPerformanceRootProps } from './types';

// The measuring view exists only in Detox test builds, where Metro resolves
// ScreenPerformanceRoot.e2e.tsx instead of this file. Rendering children untouched here keeps the
// instrumentation out of the view hierarchy of every other build.
export const ScreenPerformanceRoot = ({ children }: ScreenPerformanceRootProps) => <>{children}</>;
