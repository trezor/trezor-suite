import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type StakeFormState, type StakeType, type Timestamp } from '@suite-common/wallet-types';

export interface StakingTotalRewards {
    data?: string;
    error?: string | boolean;
    isLoading?: boolean;
    lastSuccessfulFetchTimestamp?: Timestamp;
}

export type EthNetwork = 'hoodi' | 'mainnet';

export type StakeTxBaseArgs = {
    from: string;
    symbol: NetworkSymbol;
    identity?: string;
    feeLimit?: string;
};

export interface GetStakeFormsDefaultValuesParams {
    address: string;
    stakeType: StakeFormState['stakeType'];
    amount?: string;
}

export interface PrepareStakeEthTxParams {
    symbol: NetworkSymbol;
    identity?: string;
    from: string;
    amount: string;
    gasPrice: string | undefined;
    nonce: string;
    chainId: number;
    feeLimit?: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
}

export interface PrepareUnstakeEthTxParams extends PrepareStakeEthTxParams {
    interchanges: number;
}

export type PrepareClaimEthTxParams = Omit<PrepareStakeEthTxParams, 'amount'>;

export interface GetStakeTxGasLimitParams {
    stakeType: StakeType;
    from: string;
    amount: string;
    symbol: NetworkSymbol;
    identity?: string;
}
