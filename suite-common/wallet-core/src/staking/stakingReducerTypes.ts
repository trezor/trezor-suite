import type { PrecomposedTransactionFinal, StakeFormState } from '@suite-common/wallet-types';

import type { AccountVotingDelegation } from './stakingActions';
import type { StakeDataState } from './stakingDataSlice';
import type { SerializedTx } from '../send/sendFormTypes';

export interface StakeState {
    precomposedTx?: PrecomposedTransactionFinal;
    precomposedForm?: StakeFormState;
    serializedTx?: SerializedTx; // payload for TrezorConnect.pushTransaction
    resolvedEthereumNonce?: string; // EVM nonce resolved at signing time, shown in the review modal
    votingDelegation?: AccountVotingDelegation;
    data: StakeDataState;
}

export type StakeRootState = {
    wallet: {
        stake: StakeState;
    };
};
