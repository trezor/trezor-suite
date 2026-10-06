import { type LayoutChangeEvent, View } from 'react-native';

import { type TransactionReviewStatefulOutput } from '@suite-common/wallet-types';

import { TransactionReviewOutputCard } from './TransactionReviewOutputCard';
import { TransactionReviewOutputItemContent } from './TransactionReviewOutputItemContent';
import { TransactionReviewOutputItemLabel } from './TransactionReviewOutputItemLabel';
import { useTransactionReview } from '../hooks/useTransactionReview';

type TransactionReviewOutputItemProps = {
    output: TransactionReviewStatefulOutput;
    onLayout: (event: LayoutChangeEvent) => void;
};

export const TransactionReviewOutputItem = ({
    output,
    onLayout,
}: TransactionReviewOutputItemProps) => {
    const review = useTransactionReview();

    const outputTitleOverride = review.outputTitleOverride?.(output);
    const outputValueOverride = review.outputOverride?.(output);

    const title = outputTitleOverride ?? <TransactionReviewOutputItemLabel type={output.type} />;
    const value = outputValueOverride ?? <TransactionReviewOutputItemContent output={output} />;

    return (
        <View onLayout={onLayout}>
            <TransactionReviewOutputCard title={title} outputState={output.state}>
                {value}
            </TransactionReviewOutputCard>
        </View>
    );
};
