import { type TransactionCreatedEventTxType } from '@suite-common/analytics';
import { Calldata } from '@suite-common/calldata';
import {
    type TradingRootState,
    selectTradingExchangeSelectedQuote,
    selectTradingTransactionType,
} from '@suite-common/trading';
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

const selectIsTradingDexApprovalInReview = (
    state: TradingRootState,
    transactionData: string | undefined,
) => {
    const selectedQuote = selectTradingExchangeSelectedQuote(state);

    if (!selectedQuote?.isDex) {
        return false;
    }

    const reviewedSpender = Calldata.evm.erc20.approve.decode(transactionData)?.spender;
    const quoteSpender = Calldata.evm.erc20.approve.decode(selectedQuote.dexTx?.data)?.spender;

    return !!reviewedSpender && reviewedSpender === quoteSpender;
};

export const selectTxType = (
    state: YieldRootState & TradingRootState,
    txInfoState: TxInfoState,
    precomposedForm: FormState,
): TransactionCreatedEventTxType | undefined => {
    if (isStakeState(txInfoState) || precomposedForm.tronStaking) {
        return 'stake';
    }

    if (precomposedForm.trading?.activeSection) {
        return selectTradingTransactionType(state, precomposedForm.trading.activeSection);
    }

    if (selectIsYieldTransactionInReview(state)) {
        return 'yield';
    }

    return selectIsTradingDexApprovalInReview(state, precomposedForm.transactionData)
        ? 'trade-dex'
        : undefined;
};
