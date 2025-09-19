import {
    AccountKey,
    FeeLevelLabel,
    FormDraftKeyPrefix,
    TokenAddress,
} from '@suite-common/wallet-types';

export type NativeSupportedFeeLevel = Exclude<FeeLevelLabel, 'low'>;
export type NativeSupportedPredefinedFeeLevel = Exclude<NativeSupportedFeeLevel, 'custom'>;
export type FeeLevelsMaxAmount = Record<FeeLevelLabel, string | undefined>;

export type UpdateSelectedFeeLevelThunkParams = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
    formDraftPrefix?: FormDraftKeyPrefix;
    formDraftKey?: string;
} & (
    | {
          feeLevelLabel: NativeSupportedPredefinedFeeLevel;
          feePerUnit?: never;
          feeLimit?: never;
      }
    | { feeLevelLabel: 'custom'; feePerUnit: string; feeLimit?: string }
);
