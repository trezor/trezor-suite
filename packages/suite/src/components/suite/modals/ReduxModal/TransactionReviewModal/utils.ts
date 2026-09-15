import {
    type SendState,
    type StakeState,
    type TronStakeTxReviewState,
    type YieldTxReviewState,
} from '@suite-common/wallet-core';
import { type FormState } from '@suite-common/wallet-types';

export type TxInfoState = SendState | StakeState | YieldTxReviewState | TronStakeTxReviewState;

export const isStakeState = (state: TxInfoState): state is StakeState => 'data' in state;

export const hasTxValidityExpired = (deadline: number) => deadline <= Date.now();

export const getTxType = (
    txInfoState: TxInfoState,
    precomposedForm: FormState,
    isYieldTransaction: boolean,
) => {
    if (isStakeState(txInfoState)) {
        return 'stake';
    }

    if (precomposedForm.trading?.activeSection) {
        return 'trade';
    }

    return isYieldTransaction ? 'yield' : undefined;
};
