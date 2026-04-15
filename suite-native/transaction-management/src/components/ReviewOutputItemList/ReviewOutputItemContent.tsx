import {
    type AccountKey,
    type ReviewOutputType,
    type TokenAddress,
} from '@suite-common/wallet-types';
import { Box, HStack, Text } from '@suite-native/atoms';
import { splitAddressToChunks } from '@suite-native/helpers';
import { Translation } from '@suite-native/intl';

import { ReviewOutputItemValues } from './ReviewOutputItemValues';

export type ReviewOutputItemContentProps = {
    accountKey: AccountKey;
    outputType: ReviewOutputType;
    value: string;
    tokenContract?: TokenAddress;
};

export const ReviewOutputItemContent = ({
    accountKey,
    outputType,
    value,
    tokenContract,
}: ReviewOutputItemContentProps) => {
    switch (outputType) {
        case 'amount':
            return (
                <ReviewOutputItemValues
                    accountKey={accountKey}
                    value={value}
                    translationKey="transactionManagement.review.outputs.amountLabel"
                    tokenContract={tokenContract}
                />
            );

        case 'destination-tag':
            return (
                <Text variant="body-sm">
                    {value || (
                        <Translation id="transactionManagement.review.outputs.destinationTagNotSet" />
                    )}
                </Text>
            );

        case 'address':
        case 'regular_legacy':
        case 'contract':
        case 'signing-with':
            return <Text variant="body-sm">{splitAddressToChunks(value).join(' ')}</Text>;

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

        case 'fee-limit':
            return (
                <HStack>
                    <Box flex={0.4} justifyContent="center">
                        <Text variant="body-sm">
                            <Translation id="transactionManagement.review.outputs.feeLimitLabel" />
                        </Text>
                    </Box>
                    <Box flex={0.6} alignItems="flex-end">
                        <Text variant="body-sm">{Number(value).toLocaleString()} SUN</Text>
                    </Box>
                </HStack>
            );

        default:
            // TODO: handle other output types when are other coins supported (ETH feeGas etc.)
            console.warn(
                `ReviewOutputItemContent: Unsupported output type "${outputType}" with value "${value}".`,
            );

            return null;
    }
};
