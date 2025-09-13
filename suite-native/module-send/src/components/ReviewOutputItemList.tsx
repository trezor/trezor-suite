import { useSelector } from 'react-redux';

import { AccountKey, TokenAddress } from '@suite-common/wallet-types';
import {
    ReviewOutputItemList as TMReviewOutputItemList,
    TransactionReviewOutputsState,
    selectIsTransactionAlreadySigned,
    selectReviewSummaryOutput,
    selectTransactionReviewActiveStepIndex,
    selectTransactionReviewOutputsFromDraft,
} from '@suite-native/transaction-management';

type ReviewOutputItemListProps = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
};

export const ReviewOutputItemList = ({ accountKey, tokenContract }: ReviewOutputItemListProps) => {
    const isTransactionAlreadySigned = useSelector(selectIsTransactionAlreadySigned);
    const activeStep = useSelector((state: TransactionReviewOutputsState) =>
        selectTransactionReviewActiveStepIndex(state, 'send', accountKey, tokenContract),
    );
    const reviewOutputs = useSelector((state: TransactionReviewOutputsState) =>
        selectTransactionReviewOutputsFromDraft(state, 'send', accountKey, tokenContract),
    );
    const summaryOutput = useSelector((state: TransactionReviewOutputsState) =>
        selectReviewSummaryOutput(state, 'send', accountKey, tokenContract),
    );

    return (
        <TMReviewOutputItemList
            accountKey={accountKey}
            activeStep={activeStep}
            isTransactionAlreadySigned={isTransactionAlreadySigned}
            reviewOutputs={reviewOutputs || undefined}
            summaryOutput={summaryOutput || undefined}
            tokenContract={tokenContract}
        />
    );
};
