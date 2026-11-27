import { type ExchangeTrade } from 'invity-api';

import { getProviderTransactionDeadline } from '@suite-common/trading';
import {
    type SendState,
    type StakeState,
    type TronStakeTxReviewState,
    type YieldRootState,
    type YieldTxReviewState,
    selectIsYieldTransactionInReview,
} from '@suite-common/wallet-core';
import { type Account, type FormState } from '@suite-common/wallet-types';
import { getTxValidityTimeoutInMs } from '@suite-common/wallet-utils';

export type TxInfoState = SendState | StakeState | YieldTxReviewState | TronStakeTxReviewState;

export type TransactionReviewSource = 'tronStake' | 'yield' | 'send' | 'stake';

export type GetReviewSourceParams = {
    tronStakeTxReview: TronStakeTxReviewState;
    yieldTxReview: YieldTxReviewState;
    send: SendState;
    sendPrecomposedForm: FormState | undefined;
    stake: StakeState;
    stakePrecomposedForm: FormState | undefined;
};

type TransactionReviewSelection = {
    source: TransactionReviewSource;
    txInfoState: TxInfoState;
    precomposedForm: FormState | undefined;
};

// The flows share one review modal: the first flow with a composed transaction is the one in review.
export const getReviewSource = ({
    tronStakeTxReview,
    yieldTxReview,
    send,
    sendPrecomposedForm,
    stake,
    stakePrecomposedForm,
}: GetReviewSourceParams): TransactionReviewSelection => {
    if (tronStakeTxReview.precomposedTx) {
        return {
            source: 'tronStake',
            txInfoState: tronStakeTxReview,
            precomposedForm: tronStakeTxReview.precomposedForm,
        };
    }

    if (yieldTxReview.precomposedTx) {
        return {
            source: 'yield',
            txInfoState: yieldTxReview,
            precomposedForm: yieldTxReview.precomposedForm,
        };
    }

    if (send.precomposedTx) {
        return { source: 'send', txInfoState: send, precomposedForm: sendPrecomposedForm };
    }

    return { source: 'stake', txInfoState: stake, precomposedForm: stakePrecomposedForm };
};

export const hasTxValidityExpired = (deadline: number) => deadline <= Date.now();

type GetTransactionReviewDeadlineParams = {
    networkType: Account['networkType'] | undefined;
    createdTxTimestamp: number;
    isExchange: boolean;
    selectedQuote: ExchangeTrade | undefined;
    selectedQuoteTimestamp: number | undefined;
};

export type TransactionReviewDeadline = {
    deadline: number;
    shouldCheckTxTimeValidity: boolean;
};

export const getTransactionReviewDeadline = ({
    networkType,
    createdTxTimestamp,
    isExchange,
    selectedQuote,
    selectedQuoteTimestamp,
}: GetTransactionReviewDeadlineParams): TransactionReviewDeadline => {
    const providerTransactionDeadline = isExchange
        ? getProviderTransactionDeadline({
              quote: selectedQuote,
              networkType,
              selectedQuoteTimestamp,
          })
        : undefined;

    if (providerTransactionDeadline !== undefined) {
        return { deadline: providerTransactionDeadline, shouldCheckTxTimeValidity: true };
    }

    const txValidityTimeoutMs = getTxValidityTimeoutInMs(networkType);

    return {
        deadline: createdTxTimestamp + txValidityTimeoutMs,
        shouldCheckTxTimeValidity: txValidityTimeoutMs > 0 && createdTxTimestamp !== 0,
    };
};

export const selectTxType = (
    state: YieldRootState,
    source: TransactionReviewSource,
    precomposedForm: FormState,
) => {
    if (precomposedForm.txType) {
        return precomposedForm.txType;
    }

    if (source === 'stake' || source === 'tronStake') {
        return 'stake';
    }

    if (precomposedForm.trading?.activeSection) {
        return 'trade';
    }

    if (selectIsYieldTransactionInReview(state)) {
        return 'yield';
    }

    return undefined;
};
