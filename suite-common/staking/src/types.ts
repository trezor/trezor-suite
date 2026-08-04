import type { GetNetworkConfigDep } from '@suite-common/networks';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type StakeFormState, type StakeType } from '@suite-common/wallet-types';

export type EthNetwork = 'hoodi' | 'mainnet';

export type StakeTxBaseArgs = GetNetworkConfigDep & {
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

export interface PrepareStakeEthTxParams extends GetNetworkConfigDep {
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

export interface GetStakeTxGasLimitParams extends GetNetworkConfigDep {
    stakeType: StakeType;
    from: string;
    amount: string;
    symbol: NetworkSymbol;
    identity?: string;
}

export type VerifyEthereumStakingLiveStateParams = {
    stakeType: StakeType;
    from: string;
    symbol: NetworkSymbol;
    identity?: string;
    amount?: string;
};
