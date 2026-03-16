import {
    type AccountKey,
    type FeeLevelLabel,
    type FormDraftKeyPrefix,
    type TokenAddress,
} from '@suite-common/wallet-types';

export type NativeSupportedPredefinedFeeLevel = Exclude<FeeLevelLabel, 'custom'>;
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
          maxPriorityFeePerGas?: never;
          maxFeePerGas?: never;
      }
    | {
          feeLevelLabel: 'custom';
          feePerUnit: string;
          feeLimit?: string;
          maxPriorityFeePerGas?: string;
          maxFeePerGas?: string;
      }
);
