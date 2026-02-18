import { FeatureFlag, useFeatureFlag } from '@suite-native/feature-flags';

export const useStablecoinYieldFlag = () => useFeatureFlag(FeatureFlag.IsStablecoinYieldEnabled);
