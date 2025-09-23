import { useSelector } from 'react-redux';

import { TradingType } from '@suite-common/trading';
import { AccountKey } from '@suite-common/wallet-types';
import {
    ReviewOutputItemList as TMReviewOutputItemList,
    TransactionReviewOutputsState,
    selectIsTransactionAlreadySigned,
    selectReviewSummaryOutput,
    selectTransactionReviewActiveStepIndex,
    selectTransactionReviewOutputsFromDraft,
} from '@suite-native/transaction-management';

import { getFormDraftKeyPrefixFromTradingType } from '../../utils/general/utils';

export type ReviewOutputItemListProps = {
    accountKey: AccountKey;
    tradingType: TradingType;
};

// TODO maybe can be unified to transaction-management version with tokenContract optional
export const ReviewOutputItemList = ({ accountKey, tradingType }: ReviewOutputItemListProps) => {
    const prefix = getFormDraftKeyPrefixFromTradingType(tradingType);

    const isTransactionAlreadySigned = useSelector(selectIsTransactionAlreadySigned);
    const activeStep = useSelector((state: TransactionReviewOutputsState) =>
        selectTransactionReviewActiveStepIndex(state, prefix, accountKey),
    );
    const reviewOutputs = useSelector((state: TransactionReviewOutputsState) =>
        selectTransactionReviewOutputsFromDraft(state, prefix, accountKey),
    );
    const summaryOutput = useSelector((state: TransactionReviewOutputsState) =>
        selectReviewSummaryOutput(state, prefix, accountKey),
    );

    return (
        <TMReviewOutputItemList
            accountKey={accountKey}
            activeStep={activeStep}
            isTransactionAlreadySigned={isTransactionAlreadySigned}
            reviewOutputs={reviewOutputs || undefined}
            summaryOutput={summaryOutput || undefined}
        />
    );
};
