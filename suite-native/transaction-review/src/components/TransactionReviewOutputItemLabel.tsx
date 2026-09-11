import { TransactionReviewOutputType } from '@suite-common/wallet-types';
import { Translation } from '@suite-native/intl';
import { ExchangeFlowType } from '@suite-native/navigation';
import { exhaustive } from '@trezor/type-utils';

interface TransactionReviewOutputItemLabelProps {
    type: TransactionReviewOutputType;
    flowType?: ExchangeFlowType;
}

export const TransactionReviewOutputItemLabel = ({
    type,
    flowType,
}: TransactionReviewOutputItemLabelProps) => {
    switch (type) {
        case 'address':
        case 'regular_legacy':
            switch (flowType) {
                case 'approve':
                    return (
                        <Translation id="transactionManagement.review.outputs.tokenApprovalLabel" />
                    );

                case 'revoke':
                case 'revoke-and-approve':
                    return (
                        <Translation id="transactionManagement.review.outputs.tokenRevocationLabel" />
                    );

                case 'swap':
                case 'sign-data':
                case undefined:
                    return <Translation id="transactionManagement.review.outputs.addressLabel" />;

                default:
                    throw exhaustive(flowType);
            }
        case 'amount':
            return <Translation id="transactionManagement.review.outputs.amountLabel" />;
        case 'destination-tag':
            return <Translation id="transactionManagement.review.outputs.destinationTagLabel" />;
        case 'contract':
            switch (flowType) {
                case 'approve':
                    return <Translation id="transactionManagement.review.outputs.approveToLabel" />;

                case 'revoke':
                case 'revoke-and-approve':
                    return (
                        <Translation id="transactionManagement.review.outputs.revokeApprovalFromLabel" />
                    );

                case 'swap':
                case 'sign-data':
                    return (
                        <Translation id="transactionManagement.review.outputs.swapContractLabel" />
                    );

                case undefined:
                    return <Translation id="transactionManagement.review.outputs.contractLabel" />;

                default:
                    throw exhaustive(flowType);
            }
        case 'data':
            return <Translation id="transactionManagement.review.outputs.transactionDataLabel" />;
        case 'recipient_name':
            return (
                <Translation id="transactionManagement.review.outputs.recipientNameOutputLabel" />
            );
        case 'traded_assets':
            return (
                <Translation id="transactionManagement.review.outputs.tradedAssetsOutputLabel" />
            );
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
        case 'swap_intent':
            return <Translation id="transactionManagement.review.outputs.swapIntentLabel" />;
        default:
            return type;
    }
};
