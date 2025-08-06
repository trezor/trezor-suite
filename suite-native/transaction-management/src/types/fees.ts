import { FeeLevelLabel } from '@suite-common/wallet-types';

export type NativeSupportedFeeLevel = Exclude<FeeLevelLabel, 'low'>;
export type NativeSupportedPredefinedFeeLevel = Exclude<NativeSupportedFeeLevel, 'custom'>;
export type FeeLevelsMaxAmount = Record<FeeLevelLabel, string | undefined>;
