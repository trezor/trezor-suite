import { type LayoutChangeEvent, View } from 'react-native';

import { type AccountKey, type TransactionReviewStatefulOutput } from '@suite-common/wallet-types';
import { ReviewOutputItem } from '@suite-native/transaction-management';
import { TransactionReviewOutputCard } from '@suite-native/transaction-review';

import {
    YieldTransactionReviewOutputContent,
    getYieldTransactionReviewOutputTitle,
} from './YieldTransactionReviewOutputContent';
import {
    type YieldReviewPreview,
    type YieldTransactionReviewOutput,
    isYieldApprovalReviewPurpose,
} from '../../utils/yield/yieldReviewOutputUtils';

type YieldTransactionReviewOutputItemProps = {
    accountKey: AccountKey;
    evmTransactionPurpose: YieldReviewPreview['evmTransactionPurpose'];
    onLayout: (event: LayoutChangeEvent) => void;
    reviewOutput: TransactionReviewStatefulOutput;
};

export const YieldTransactionReviewOutputItem = ({
    accountKey,
    evmTransactionPurpose,
    onLayout,
    reviewOutput,
}: YieldTransactionReviewOutputItemProps) => {
    if (isYieldApprovalReviewPurpose(evmTransactionPurpose)) {
        return (
            <ReviewOutputItem
                accountKey={accountKey}
                flowType={evmTransactionPurpose}
                onLayout={onLayout}
                reviewOutput={reviewOutput}
            />
        );
    }

    const yieldReviewOutput = reviewOutput as YieldTransactionReviewOutput;

    return (
        <View onLayout={onLayout}>
            <TransactionReviewOutputCard
                title={getYieldTransactionReviewOutputTitle({
                    evmTransactionPurpose,
                    reviewOutput: yieldReviewOutput,
                })}
                outputState={reviewOutput.state}
            >
                <YieldTransactionReviewOutputContent
                    accountKey={accountKey}
                    evmTransactionPurpose={evmTransactionPurpose}
                    reviewOutput={yieldReviewOutput}
                />
            </TransactionReviewOutputCard>
        </View>
    );
};
