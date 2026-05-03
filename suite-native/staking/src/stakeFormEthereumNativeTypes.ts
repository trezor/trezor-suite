import {
    type PushTransactionError,
    type SignTransactionError,
    type SignTransactionTimeoutError,
} from '@suite-common/wallet-core';
import { type Account, type StakeFormState, type StakeType } from '@suite-common/wallet-types';
import { type FeeLevel } from '@trezor/connect';

export type SignEthereumStakingRejectValue =
    | SignTransactionError
    | SignTransactionTimeoutError
    | PushTransactionError
    | undefined;

export type EthereumAccount = Account & { networkType: 'ethereum' };
export type EthereumStakingType = Extract<StakeType, 'stake' | 'unstake' | 'claim'>;

export type EthereumStakingVariant = {
    stakeType: EthereumStakingType;
    calldata: string;
    contractAddress: string;
    value: string;
};

export type PreparedEthereumStakingContext = {
    account: EthereumAccount;
    chainId: number;
    gasLimit: string;
    variant: EthereumStakingVariant;
    feeLevel: FeeLevel;
    formState: StakeFormState;
};

export type Failure = { ok: false; error: SignEthereumStakingRejectValue };
