import type { Network, NetworkSymbol } from '@suite-common/wallet-config';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';
import type { FeeLevel } from '@trezor/connect';
import { BigNumber } from '@trezor/utils';

import { Account } from './account';
import { CardanoPoolInfo } from './cardanoStaking';
import { StakeFormState } from './stakeForm';
import { ExcludedUtxos, FeeInfo, PrecomposedLevels } from './transaction';

export type StakingLimits = {
    MIN_AMOUNT_FOR_STAKING: BigNumber;
    MAX_AMOUNT_FOR_STAKING: BigNumber;
    MIN_FOR_WITHDRAWALS: BigNumber;
    MIN_BALANCE_FOR_FEE_BUFFER: BigNumber;
    MIN_BALANCE_FOR_STAKING: BigNumber;
    MIN_AMOUNT_FOR_STAKING_DASHBOARD: BigNumber;
};

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
    [EverstakeAssetEndpointType.StakingInfo]: {
        sol: 'chain',
        dsol: 'chain',
        ada: 'blockchain/summary',
    },
};

export type EverstakeDataParams = {
    symbol: NetworkSymbol;
    endpointType: EverstakeEndpointType;
    timestamp?: number;
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

export interface EverstakeStakingInfo {
    apy?: number;
    pools?: CardanoPoolInfo[];
}

export type ChangeDelegateFormState = StakeFormState;

export interface CardanoValidatorStats {
    apr: { value: string };
    apy: { value: string };
    blockchain_name: string;
    date: string;
    delegators_number: number;
    fee: string;
    precision: number;
    price: number;
    saturation: number;
    stake: string;
    token: string;
    total_stake_usd: number;
    validator_address: string;
    validator_name: string;
}

// TODO: is this still needed?
export interface ComposeActionContext {
    account: Account;
    network: Network;
    feeInfo: FeeInfo;
    excludedUtxos?: ExcludedUtxos;
    prison?: Record<string, unknown>;
}
