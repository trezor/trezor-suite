import { TransactionReviewStatefulOutput } from '@suite-common/wallet-types';
import { LayoutChangeEvent, View } from 'react-native';
import { useTransactionReview } from '../hooks/useTransactionReview';
import { TransactionReviewOutputCard } from './TransactionReviewOutputCard';
import { TransactionReviewOutputItemContent } from './TransactionReviewOutputItemContent';
import { TransactionReviewOutputItemLabel } from './TransactionReviewOutputItemLabel';

interface TransactionReviewOutputItemProps {
    output: TransactionReviewStatefulOutput;
    onLayout: (event: LayoutChangeEvent) => void;
}

export const TransactionReviewOutputItem = ({
    output,
    onLayout,
}: TransactionReviewOutputItemProps) => {
    const review = useTransactionReview();

    if (output.type === 'rewards') return null;

    const enhancedOutput = (
        output.type === 'traded_assets'
            ? { ...output, send: output.send, receive: output.receive }
            : { ...output, send: undefined, receive: undefined }
    ) satisfies TransactionReviewStatefulOutput;

    return (
        <View onLayout={onLayout}>
            <TransactionReviewOutputCard
                title={
                    <TransactionReviewOutputItemLabel
                        type={output.type}
                        flowType={review.flowType}
                    />
                }
                outputState={output.state}
            >
                <TransactionReviewOutputItemContent output={enhancedOutput} />
            </TransactionReviewOutputCard>
        </View>
    );
};
