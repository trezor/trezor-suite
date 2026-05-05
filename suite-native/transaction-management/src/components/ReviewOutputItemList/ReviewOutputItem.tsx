import type { ReactNode } from 'react';
import { type LayoutChangeEvent, View } from 'react-native';

import {
    type AccountKey,
    type ReviewOutputType,
    type TokenAddress,
} from '@suite-common/wallet-types';
import { Translation } from '@suite-native/intl';
import { type ExchangeFlowType } from '@suite-native/navigation';

import { ReviewOutputCard } from './ReviewOutputCard';
import { ReviewOutputItemContent } from './ReviewOutputItemContent';
import { type StatefulReviewOutput } from '../../types';

export type ReviewOutputItemProps = {
    accountKey: AccountKey;
    reviewOutput: StatefulReviewOutput;
    onLayout: (event: LayoutChangeEvent) => void;
    tokenContract?: TokenAddress;
    flowType?: ExchangeFlowType;
};

const OutputLabel = ({
    type,
    flowType,
}: {
    type: ReviewOutputType;
    flowType?: ExchangeFlowType;
}): ReactNode => {
    switch (type) {
        case 'address':
        case 'regular_legacy':
            if (flowType === 'approve') {
                return <Translation id="transactionManagement.review.outputs.tokenApprovalLabel" />;
            }
            if (flowType === 'revoke' || flowType === 'revoke-and-approve') {
                return (
                    <Translation id="transactionManagement.review.outputs.tokenRevocationLabel" />
                );
            }

            return <Translation id="transactionManagement.review.outputs.addressLabel" />;
        case 'amount':
            return <Translation id="transactionManagement.review.outputs.amountLabel" />;
        case 'destination-tag':
            return <Translation id="transactionManagement.review.outputs.destinationTagLabel" />;
        case 'contract':
            if (flowType === 'approve') {
                return <Translation id="transactionManagement.review.outputs.approveToLabel" />;
            }
            if (flowType === 'revoke' || flowType === 'revoke-and-approve') {
                return (
                    <Translation id="transactionManagement.review.outputs.revokeApprovalFromLabel" />
                );
            }

            return <Translation id="transactionManagement.review.outputs.contractLabel" />;
        case 'timebounds':
            return <Translation id="transactionManagement.review.outputs.timeboundsLabel" />;
        case 'signing-with':
            return <Translation id="transactionManagement.review.outputs.signingWithLabel" />;
        case 'network':
            return <Translation id="transactionManagement.review.outputs.networkLabel" />;
        case 'approve_data':
            if (flowType === 'revoke' || flowType === 'revoke-and-approve') {
                return <Translation id="transactionManagement.review.outputs.revokeLabel" />;
            }

            return <Translation id="transactionManagement.review.outputs.approveLabel" />;
        case 'fee-limit':
            return <Translation id="transactionManagement.review.outputs.feeLimitSummaryLabel" />;
        case 'note':
            return <Translation id="transactionManagement.review.outputs.noteLabel" />;
        default:
            return type;
    }
};

export const ReviewOutputItem = ({
    accountKey,
    reviewOutput,
    onLayout,
    tokenContract,
    flowType,
}: ReviewOutputItemProps) => {
    const { state, type, value, value2, token } = reviewOutput;

    return (
        <View onLayout={onLayout}>
            <ReviewOutputCard
                title={<OutputLabel type={type} flowType={flowType} />}
                outputState={state}
            >
                <ReviewOutputItemContent
                    accountKey={accountKey}
                    outputType={type}
                    value={value}
                    value2={value2}
                    token={token}
                    tokenContract={tokenContract}
                    flowType={flowType}
                />
            </ReviewOutputCard>
        </View>
    );
};
