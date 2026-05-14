import type { PrecomposedTransactionFinal, StakeFormState } from '@suite-common/wallet-types';

import type { VotingDelegationOption } from './stakeActions';
import type { StakeDataState } from './stakeDataSlice';
import type { SerializedTx } from '../send/sendFormTypes';

export interface StakeState {
    precomposedTx?: PrecomposedTransactionFinal;
    precomposedForm?: StakeFormState;
    serializedTx?: SerializedTx; // payload for TrezorConnect.pushTransaction
    votingDelegation: VotingDelegationOption;
    data: StakeDataState;
}

export type StakeRootState = {
    wallet: {
        stake: StakeState;
    };
};
