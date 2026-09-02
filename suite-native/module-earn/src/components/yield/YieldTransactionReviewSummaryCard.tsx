import { type LayoutChangeEvent, View } from 'react-native';

import { type AccountKey, type ReviewOutputState } from '@suite-common/wallet-types';
import { Translation } from '@suite-native/intl';
import { ReviewOutputCard, ReviewOutputItemValues } from '@suite-native/transaction-management';

type YieldTransactionReviewSummaryCardProps = {
    accountKey: AccountKey;
    fee: string;
    onLayout: (event: LayoutChangeEvent) => void;
    outputState: ReviewOutputState;
};

export const YieldTransactionReviewSummaryCard = ({
    accountKey,
    fee,
    onLayout,
    outputState,
}: YieldTransactionReviewSummaryCardProps) => (
    <View onLayout={onLayout}>
        <ReviewOutputCard
            title={<Translation id="transactionManagement.review.outputs.summary.label" />}
            outputState={outputState}
        >
            <ReviewOutputItemValues
                accountKey={accountKey}
                value={fee}
                translationKey="transactionManagement.review.outputs.summary.maxFee"
            />
        </ReviewOutputCard>
    </View>
);
