import { FeatureFlag, useFeatureFlag } from '@suite-native/feature-flags';

export const useSolanaStakingFlag = () => useFeatureFlag(FeatureFlag.IsSolanaStakingEnabled);
