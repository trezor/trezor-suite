import { type TransactionReviewOutputType } from '@suite-common/wallet-types';
import { Translation } from '@suite-native/intl';

type TransactionReviewOutputItemLabelProps = {
    type: TransactionReviewOutputType;
};

export const TransactionReviewOutputItemLabel = ({
    type,
}: TransactionReviewOutputItemLabelProps) => {
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
        case 'data':
            return <Translation id="transactionManagement.review.outputs.transactionDataLabel" />;
        case 'recipient_name':
            return (
                <Translation id="transactionManagement.review.outputs.recipientProviderNameOutputLabel" />
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
