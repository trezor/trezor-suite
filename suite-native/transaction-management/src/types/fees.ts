import { AccountKey, FeeLevelLabel, TokenAddress } from '@suite-common/wallet-types';

export type NativeSupportedFeeLevel = Exclude<FeeLevelLabel, 'low'>;
export type NativeSupportedPredefinedFeeLevel = Exclude<NativeSupportedFeeLevel, 'custom'>;
export type FeeLevelsMaxAmount = Record<FeeLevelLabel, string | undefined>;

export type UpdateSelectedFeeLevelThunkParams = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
} & (
    | {
          feeLevelLabel: NativeSupportedPredefinedFeeLevel;
          feePerUnit?: never;
          feeLimit?: never;
      }
    | { feeLevelLabel: 'custom'; feePerUnit: string; feeLimit?: string }
);
