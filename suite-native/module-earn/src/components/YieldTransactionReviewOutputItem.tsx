import { type LayoutChangeEvent, View } from 'react-native';

import { type AccountKey } from '@suite-common/wallet-types';
import {
    ReviewOutputCard,
    ReviewOutputItem,
    type StatefulReviewOutput,
} from '@suite-native/transaction-management';

import {
    YieldTransactionReviewOutputContent,
    getYieldTransactionReviewOutputTitle,
} from './YieldTransactionReviewOutputContent';
import {
    type YieldReviewPreview,
    type YieldTransactionReviewOutput,
    isYieldApprovalReviewPurpose,
} from '../utils/yieldReviewOutputUtils';

type YieldTransactionReviewOutputItemProps = {
    accountKey: AccountKey;
    evmTransactionPurpose: YieldReviewPreview['evmTransactionPurpose'];
    onLayout: (event: LayoutChangeEvent) => void;
    reviewOutput: StatefulReviewOutput;
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
            <ReviewOutputCard
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
            </ReviewOutputCard>
        </View>
    );
};
