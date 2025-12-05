import { FeatureFlag, useFeatureFlag } from '@suite-native/feature-flags';

export const useTradingDebugModeFlag = () => useFeatureFlag(FeatureFlag.IsTradingDebugEnabled);
