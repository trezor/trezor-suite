import { type TransactionReviewStatefulOutput } from '@suite-common/wallet-types';
import { Text, VStack } from '@suite-native/atoms';
import { AddressFormatter } from '@suite-native/formatters';
import { Translation } from '@suite-native/intl';

import { TransactionReviewCardanoTokenDetails } from './TransactionReviewCardanoTokenDetails';
import { TransactionReviewOutputHexData } from './TransactionReviewOutputHexData';
import { TransactionReviewOutputItemRow } from './TransactionReviewOutputItemRow';
import { TransactionReviewOutputItemValues } from './TransactionReviewOutputItemValues';
import { useTransactionReview } from '../hooks/useTransactionReview';

interface TransactionReviewOutputItemContentProps {
    output: TransactionReviewStatefulOutput;
}

export const TransactionReviewOutputItemContent = ({
    output,
}: TransactionReviewOutputItemContentProps) => {
    const review = useTransactionReview();

    if (!review.account) return null;

    switch (output.type) {
        case 'amount':
            return (
                <VStack spacing="sp12">
                    <TransactionReviewOutputItemValues
                        accountKey={review.account.key}
                        tokenContract={review.tokenContract}
                        value={output.value}
                        translationKey="transactionManagement.review.outputs.amountLabel"
                    />
                    {review.account.networkType === 'cardano' && (
                        <TransactionReviewCardanoTokenDetails value={output.value} />
                    )}
                </VStack>
            );
        case 'destination-tag':
            return (
                <Text variant="body-sm">
                    {output.value || (
                        <Translation id="transactionManagement.review.outputs.destinationTagNotSet" />
                    )}
                </Text>
            );

        case 'address':
        case 'regular_legacy':
        case 'contract':
        case 'signing-with':
            return <AddressFormatter value={output.value} format="full" variant="body-sm" />;

        case 'timebounds':
            return (
                <Text variant="body-sm">
                    <Translation id="transactionManagement.review.outputs.timeboundsNotSet" />
                </Text>
            );

        case 'network':
            return (
                <Text variant="body-sm">
                    <Translation id="transactionManagement.review.outputs.networkTestnet" />
                </Text>
            );

        case 'data':
            return <TransactionReviewOutputHexData value={output.value} />;

        case 'recipient_name':
            return (
                <Text variant="body-sm" selectable>
                    {output.value}
                </Text>
            );

        case 'note':
            return <Text variant="body-sm">{output.value}</Text>;

        case 'fee-limit':
            return (
                <TransactionReviewOutputItemRow translationKey="transactionManagement.review.outputs.feeLimitLabel">
                    {Number(output.value).toLocaleString()} SUN
                </TransactionReviewOutputItemRow>
            );
        case 'swap_intent':
            return (
                <Text variant="body-sm">
                    {output.value === 'swap' ? (
                        <Translation id="transactionManagement.review.outputs.swapIntentValue" />
                    ) : (
                        output.value
                    )}
                </Text>
            );
        default:
            // TODO: handle other output types when are other coins supported (ETH feeGas etc.)
            console.warn(
                `ReviewOutputItemContent: Unsupported output type "${output.type}" with value "${output.value}".`,
            );

            return null;
    }
};
