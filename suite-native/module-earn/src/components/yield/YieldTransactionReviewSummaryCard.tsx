import { type LayoutChangeEvent, View } from 'react-native';

import { type AccountKey, type TransactionReviewOutputState } from '@suite-common/wallet-types';
import { Translation } from '@suite-native/intl';
import {
    TransactionReviewOutputCard,
    TransactionReviewOutputItemValues,
} from '@suite-native/transaction-review';

type YieldTransactionReviewSummaryCardProps = {
    accountKey: AccountKey;
    fee: string;
    onLayout: (event: LayoutChangeEvent) => void;
    outputState: TransactionReviewOutputState;
};

export const YieldTransactionReviewSummaryCard = ({
    accountKey,
    fee,
    onLayout,
    outputState,
}: YieldTransactionReviewSummaryCardProps) => (
    <View onLayout={onLayout}>
        <TransactionReviewOutputCard
            title={<Translation id="transactionManagement.review.outputs.summary.label" />}
            outputState={outputState}
        >
            <TransactionReviewOutputItemValues
                accountKey={accountKey}
                value={fee}
                translationKey="transactionManagement.review.outputs.summary.maxFee"
            />
        </TransactionReviewOutputCard>
    </View>
);
