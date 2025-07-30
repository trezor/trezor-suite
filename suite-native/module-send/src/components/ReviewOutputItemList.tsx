import { useSelector } from 'react-redux';

import { AccountsRootState, DeviceRootState, SendRootState } from '@suite-common/wallet-core';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';
import { ReviewOutputItemList as TMReviewOutputItemList } from '@suite-native/transaction-management';

import {
    selectIsTransactionAlreadySigned,
    selectReviewSummaryOutput,
    selectTransactionReviewActiveStepIndex,
    selectTransactionReviewOutputs,
} from '../selectors';
type ReviewOutputItemListProps = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
};

export const ReviewOutputItemList = ({ accountKey, tokenContract }: ReviewOutputItemListProps) => {
    const isTransactionAlreadySigned = useSelector(selectIsTransactionAlreadySigned);
    const activeStep = useSelector((state: AccountsRootState & DeviceRootState & SendRootState) =>
        selectTransactionReviewActiveStepIndex(state, accountKey, tokenContract),
    );
    const reviewOutputs = useSelector(
        (state: AccountsRootState & DeviceRootState & SendRootState) =>
            selectTransactionReviewOutputs(state, accountKey, tokenContract),
    );
    const summaryOutput = useSelector(
        (state: AccountsRootState & DeviceRootState & SendRootState) =>
            selectReviewSummaryOutput(state, accountKey, tokenContract),
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
