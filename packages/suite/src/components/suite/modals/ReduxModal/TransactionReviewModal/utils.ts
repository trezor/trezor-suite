import { type SendState, type StakeState } from '@suite-common/wallet-core';
import { type FormState } from '@suite-common/wallet-types';

export const isStakeState = (state: SendState | StakeState): state is StakeState => 'data' in state;

export const hasTxValidityExpired = (deadline: number) => deadline <= Date.now();

export const getTxType = (txInfoState: SendState | StakeState, precomposedForm: FormState) => {
    const stakeType = isStakeState(txInfoState) ? 'stake' : undefined;
    const tradeType = precomposedForm.trading?.activeSection ? 'trade' : undefined;

    return stakeType ?? tradeType;
};
