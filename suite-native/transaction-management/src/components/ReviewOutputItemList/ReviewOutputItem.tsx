import { type LayoutChangeEvent, View } from 'react-native';

import {
    type AccountKey,
    type ReviewOutputType,
    type TokenAddress,
} from '@suite-common/wallet-types';
import { Translation } from '@suite-native/intl';

import { ReviewOutputCard } from './ReviewOutputCard';
import { ReviewOutputItemContent } from './ReviewOutputItemContent';
import { type StatefulReviewOutput } from '../../types';

export type ReviewOutputItemProps = {
    accountKey: AccountKey;
    reviewOutput: StatefulReviewOutput;
    onLayout: (event: LayoutChangeEvent) => void;
    tokenContract?: TokenAddress;
};

const OutputLabel = ({ type }: { type: ReviewOutputType }) => {
    switch (type) {
        case 'address':
        case 'regular_legacy':
            return <Translation id="transactionManagement.review.outputs.addressLabel" />;
        case 'amount':
            return <Translation id="transactionManagement.review.outputs.amountLabel" />;
        case 'destination-tag':
            return <Translation id="transactionManagement.review.outputs.destinationTagLabel" />;
        case 'contract':
            return <Translation id="transactionManagement.review.outputs.contractLabel" />;
        case 'timebounds':
            return <Translation id="transactionManagement.review.outputs.timeboundsLabel" />;
        case 'signing-with':
            return <Translation id="transactionManagement.review.outputs.signingWithLabel" />;
        case 'network':
            return <Translation id="transactionManagement.review.outputs.networkLabel" />;
        case 'fee-limit':
            return <Translation id="transactionManagement.review.outputs.feeLimitSummaryLabel" />;
        default:
            return type;
    }
};

export const ReviewOutputItem = ({
    accountKey,
    reviewOutput,
    onLayout,
    tokenContract,
}: ReviewOutputItemProps) => {
    const { state, type, value } = reviewOutput;

    return (
        <View onLayout={onLayout}>
            <ReviewOutputCard title={<OutputLabel type={type} />} outputState={state}>
                <ReviewOutputItemContent
                    accountKey={accountKey}
                    outputType={type}
                    value={value}
                    tokenContract={tokenContract}
                />
            </ReviewOutputCard>
        </View>
    );
};
