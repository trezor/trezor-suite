import type { Network } from '@suite-common/wallet-config';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';
import type { FeeLevel } from '@trezor/connect';
import { type BigNumber } from '@trezor/utils';

import { type Account } from './account';
import { type StakeFormState } from './stakeForm';
import { type ExcludedUtxos, type FeeInfo, type PrecomposedLevels } from './transaction';

export type StakingLimits = {
    MIN_AMOUNT_FOR_STAKING: BigNumber;
    MAX_AMOUNT_FOR_STAKING: BigNumber;
    MIN_FOR_WITHDRAWALS: BigNumber;
    MIN_BALANCE_FOR_FEE_BUFFER: BigNumber;
    MIN_BALANCE_FOR_STAKING: BigNumber;
    MIN_AMOUNT_FOR_STAKING_DASHBOARD: BigNumber;
};

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

export type ChangeDelegateFormState = StakeFormState;

// TODO: is this still needed?
export interface ComposeActionContext {
    account: Account;
    network: Network;
    feeInfo: FeeInfo;
    excludedUtxos?: ExcludedUtxos;
    prison?: Record<string, unknown>;
}
