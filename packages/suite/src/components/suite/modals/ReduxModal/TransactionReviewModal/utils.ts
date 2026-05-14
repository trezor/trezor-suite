import {
    type SendState,
    type StablecoinYieldTxReviewState,
    type StakeState,
} from '@suite-common/wallet-core';
import { type FormState } from '@suite-common/wallet-types';

export type TxInfoState = SendState | StakeState | StablecoinYieldTxReviewState;

export const isStakeState = (state: TxInfoState): state is StakeState => 'data' in state;

export const hasTxValidityExpired = (deadline: number) => deadline <= Date.now();

export const getTxType = (txInfoState: TxInfoState, precomposedForm: FormState) => {
    const stakeType = isStakeState(txInfoState) ? 'stake' : undefined;
    const tradeType = precomposedForm.trading?.activeSection ? 'trade' : undefined;

    return stakeType ?? tradeType;
};
