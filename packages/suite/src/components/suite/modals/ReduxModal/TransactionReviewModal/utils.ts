import {
    type SendState,
    type StakeState,
    type TronStakeTxReviewState,
    type YieldRootState,
    type YieldTxReviewState,
    selectIsYieldTransactionInReview,
} from '@suite-common/wallet-core';
import { type FormState } from '@suite-common/wallet-types';

export type TxInfoState = SendState | StakeState | YieldTxReviewState | TronStakeTxReviewState;

export const isStakeState = (state: TxInfoState): state is StakeState => 'data' in state;

export const hasTxValidityExpired = (deadline: number) => deadline <= Date.now();

export const selectTxType = (
    state: YieldRootState,
    txInfoState: TxInfoState,
    precomposedForm: FormState,
) => {
    if (isStakeState(txInfoState)) {
        return 'stake';
    }

    if (precomposedForm.trading?.activeSection) {
        return 'trade';
    }

    return selectIsYieldTransactionInReview(state) ? 'yield' : undefined;
};
