import { type Account, type StakeFormState } from '@suite-common/wallet-types';
import { type FeeLevel } from '@trezor/connect';

import { type SignStakeNativeRejectValue, type StakeNativeType } from './stakeNativeTypes';

export type EthereumAccount = Account & { networkType: 'ethereum' };

export type EthereumStakingVariant = {
    stakeType: StakeNativeType;
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

export type Failure = { ok: false; error: SignStakeNativeRejectValue };
