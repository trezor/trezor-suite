import { type Account, type StakeFormState } from '@suite-common/wallet-types';
import { type FeeLevel } from '@trezor/connect';

import { type SignStakeNativeRejectValue, type StakeNativeType } from './stakeNativeTypes';

export type SignEthereumStakingRejectValue = SignStakeNativeRejectValue;

export type EthereumAccount = Account & { networkType: 'ethereum' };
export type EthereumStakingType = StakeNativeType;

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
