import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type AccountKey,
    type ReviewOutputType,
    type TokenAddress,
} from '@suite-common/wallet-types';
import { convertAmountSubunitsToUnits } from '@suite-common/wallet-utils';
import { Box, HStack, Text, VStack } from '@suite-native/atoms';
import { CryptoAmountFormatter } from '@suite-native/formatters';
import { splitAddressToChunks } from '@suite-native/helpers';
import { Translation } from '@suite-native/intl';
import { type ExchangeFlowType } from '@suite-native/navigation';
import type { TokenInfo } from '@trezor/connect';

import { ReviewOutputItemValues } from './ReviewOutputItemValues';

export type ReviewOutputItemContentProps = {
    accountKey: AccountKey;
    outputType: ReviewOutputType;
    value: string;
    value2?: string;
    token?: TokenInfo;
    tokenContract?: TokenAddress;
    flowType?: ExchangeFlowType;
};

export const ReviewOutputItemContent = ({
    accountKey,
    outputType,
    value,
    value2,
    token,
    tokenContract,
    flowType,
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
            if (flowType === 'approve') {
                return (
                    <Text variant="body-sm">
                        <Translation id="transactionManagement.review.outputs.tokenApprovalDescription" />
                    </Text>
                );
            }
            if (flowType === 'revoke') {
                return (
                    <Text variant="body-sm">
                        <Translation id="transactionManagement.review.outputs.tokenRevocationDescription" />
                    </Text>
                );
            }

            return <Text variant="body-sm">{splitAddressToChunks(value).join(' ')}</Text>;

        case 'contract':
            if (flowType === 'approve' || flowType === 'revoke') {
                return <Text variant="body-sm">{value}</Text>;
            }

            return <Text variant="body-sm">{splitAddressToChunks(value).join(' ')}</Text>;

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

        case 'approve_data':
            if (flowType === 'approve' && token) {
                return (
                    <VStack>
                        <HStack justifyContent="space-between">
                            <Text variant="body-sm">
                                <Translation id="transactionManagement.review.outputs.amountAllowanceLabel" />
                            </Text>
                            <CryptoAmountFormatter
                                variant="body-sm"
                                color="contentPrimary"
                                value={convertAmountSubunitsToUnits(value, token.decimals)}
                                symbol={token.symbol as NetworkSymbol}
                                decimals={token.decimals}
                                isDiscreetText={false}
                            />
                        </HStack>
                        {!!value2 && (
                            <HStack justifyContent="space-between">
                                <Text variant="body-sm">
                                    <Translation id="transactionManagement.review.outputs.chainLabel" />
                                </Text>
                                <Text variant="body-sm">{value2}</Text>
                            </HStack>
                        )}
                    </VStack>
                );
            }
            if (flowType === 'revoke' && token) {
                return (
                    <VStack>
                        <HStack justifyContent="space-between">
                            <Text variant="body-sm">
                                <Translation id="transactionManagement.review.outputs.tokenLabel" />
                            </Text>
                            <Text variant="body-sm">{token.symbol}</Text>
                        </HStack>
                        {!!value2 && (
                            <HStack justifyContent="space-between">
                                <Text variant="body-sm">
                                    <Translation id="transactionManagement.review.outputs.chainLabel" />
                                </Text>
                                <Text variant="body-sm">{value2}</Text>
                            </HStack>
                        )}
                    </VStack>
                );
            }

            console.warn(
                `ReviewOutputItemContent: Unsupported output type "${outputType}" with value "${value}".`,
            );

            return null;

        case 'note':
            return <Text variant="body-sm">{value}</Text>;

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
