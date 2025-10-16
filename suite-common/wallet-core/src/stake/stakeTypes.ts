import type { FormState as ReactHookFormState, UseFormReturn } from 'react-hook-form';

import type { Network } from '@suite-common/wallet-config';
import type {
    Account,
    FeeInfo,
    PrecomposedLevels,
    Rate,
    StakeFormState,
} from '@suite-common/wallet-types';
import type { StakingLimits } from '@suite-common/wallet-utils';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';
import type { FeeLevel } from '@trezor/connect';

export enum EverstakeEndpointType {
    PoolStats = 'poolStats',
    ValidatorsQueue = 'validatorsQueue',
}

export const EVERSTAKE_ENDPOINT_TYPES = {
    [EverstakeEndpointType.PoolStats]: 'stats',
    [EverstakeEndpointType.ValidatorsQueue]: 'validators/queue',
};

export enum EverstakeAssetEndpointType {
    StakingInfo = 'stakingInfo',
}

export enum EverstakeRewardsEndpointType {
    GetRewards = 'stakingRewards',
}

export const EVERSTAKE_ASSET_ENDPOINT_TYPES = {
    [EverstakeAssetEndpointType.StakingInfo]: 'chain',
};

export interface ValidatorsQueue {
    validatorsEnteringNum?: number;
    validatorsExitingNum?: number;
    validatorsTotalCount?: number;
    validatorsPerEpoch?: number;
    validatorActivationTime?: number;
    validatorExitTime?: number;
    validatorWithdrawTime?: number;
    validatorAddingDelay?: number;
    updatedAt?: number;
}

export interface AmountLimitsString {
    currency: string;
    minCrypto?: string;
    maxCrypto?: string;

    minFiat?: string;
    maxFiat?: string;
}

export interface BaseStakeContextValues {
    account: Account;
    network: Network;
    baseCurrencyCode: BaseCurrencyCode;
    composedLevels?: PrecomposedLevels;
    isComposing: boolean;
    clearForm: () => void;
    signTx: () => Promise<void>;
    selectedFee: FeeLevel['label'];
    feeInfo: FeeInfo;
    changeFeeLevel: (level: FeeLevel['label']) => void;
}

export type StakeContextValues = UseFormReturn<StakeFormState> &
    BaseStakeContextValues & {
        methods: UseFormReturn<StakeFormState>;
        formState: ReactHookFormState<StakeFormState>;
        removeDraft: (key: string) => void;
        isDraft: boolean;
        amountLimits?: AmountLimitsString;
        isAmountForWithdrawalWarningShown: boolean;
        isLessAmountForWithdrawalWarningShown: boolean;
        showAdviceBanner: boolean;
        isConfirmModalOpen: boolean;
        stakingLimits: StakingLimits | null;
        onCryptoAmountChange: (amount: string) => void;
        onFiatAmountChange: (amount: string) => void;
        setMax: () => void;
        setRatioAmount: (divisor: number) => void;
        closeConfirmModal: () => void;
        onSubmit: () => void;
        currentRate: Rate | undefined;
        isLoading: boolean;
        currency?: 'crypto' | 'fiat';
        setCurrency: (currency: 'crypto' | 'fiat') => void;
        isStakingDisabled: boolean;
    };

export type UnstakeFormState = Omit<StakeFormState, 'setMaxOutputId'>;

export type UnstakeContextValues = UseFormReturn<UnstakeFormState> &
    BaseStakeContextValues & {
        methods: UseFormReturn<UnstakeFormState>;
        formState: ReactHookFormState<StakeFormState>;
        onCryptoAmountChange: (amount: string) => Promise<void>;
        onFiatAmountChange: (amount: string) => void;
        currentRate: Rate | undefined;
    };

export type StakeAccountRewards = {
    height: number;
    epoch: number;
    validator: string;
    authority: string;
    stake_account: string;
    amount: string;
    currency: string;
    time: string;
};

export type StakeRewardsByAccount = {
    [address: string]: StakeAccountRewards[];
};

export type TotalStakeRewardsByAccount = {
    [address: string]: string;
};
