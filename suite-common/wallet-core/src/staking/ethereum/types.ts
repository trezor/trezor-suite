import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type StakeFormState, type StakeType } from '@suite-common/wallet-types';

export type StakeTxBaseArgs = {
    from: string;
    symbol: NetworkSymbol;
    identity?: string;
    feeLimit?: string;
    source?: string;
};

export type EthereumStakingTransactionDraft = {
    to: string;
    value: string;
    gasLimit: number | string;
    data: string;
};

export interface GetStakeFormsDefaultValuesParams {
    address: string;
    stakeType: StakeFormState['stakeType'];
    amount?: string;
}

export interface GetStakeTxGasLimitParams {
    stakeType: StakeType;
    from: string;
    amount: string;
    symbol: NetworkSymbol;
    identity?: string;
    source?: string;
}

export type VerifyEthereumStakingLiveStateParams = {
    stakeType: StakeType;
    from: string;
    symbol: NetworkSymbol;
    identity?: string;
    amount?: string;
};
