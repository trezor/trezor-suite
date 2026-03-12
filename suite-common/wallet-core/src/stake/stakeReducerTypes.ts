import type {
    CardanoPoolsStats,
    EthereumValidatorsQueue,
    SolanaStakeRewardsByAccount,
    SolanaStakingInfo,
    SolanaTotalStakeRewardsByAccount,
} from '@suite-common/wallet-api';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import type {
    PrecomposedTransactionFinal,
    StakeFormState,
    Timestamp,
} from '@suite-common/wallet-types';

import type { VotingDelegationOption } from './stakeActions';
import type { SerializedTx } from '../send/sendFormTypes';

type ApiRequest<T> = {
    error: boolean | string;
    isLoading: boolean;
    lastSuccessfulFetchTimestamp: Timestamp;
    data: T | null;
};

export interface StakeState {
    precomposedTx?: PrecomposedTransactionFinal;
    precomposedForm?: StakeFormState;
    serializedTx?: SerializedTx; // payload for TrezorConnect.pushTransaction
    votingDelegation: VotingDelegationOption;
    data: {
        [key in NetworkSymbol]?: {
            poolStats?: ApiRequest<{
                ethApy: number;
                nextRewardPayout: number;
            }>;
            validatorsQueue?: ApiRequest<EthereumValidatorsQueue>;
            stakingInfo?: ApiRequest<SolanaStakingInfo | CardanoPoolsStats>;
            stakingRewards?: ApiRequest<{
                rewardsHistory: SolanaStakeRewardsByAccount;
                totalRewards: SolanaTotalStakeRewardsByAccount;
            }>;
        };
    };
}

export type StakeRootState = { wallet: { stake: StakeState } };
