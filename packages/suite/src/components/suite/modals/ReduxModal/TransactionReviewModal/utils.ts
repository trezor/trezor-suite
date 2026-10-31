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

export const isStakeState = (state: TxInfoState): state is StakeState => 'data' in state;

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
    txInfoState: TxInfoState,
    precomposedForm: FormState,
) => {
    if (precomposedForm.txType) {
        return precomposedForm.txType;
    }

    if (isStakeState(txInfoState) || precomposedForm.tronStaking) {
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
