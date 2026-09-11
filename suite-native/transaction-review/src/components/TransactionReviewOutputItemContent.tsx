import { TokenSymbol, TransactionReviewStatefulOutput } from '@suite-common/wallet-types';
import { isAllowanceUnlimited } from '@suite-common/wallet-utils';
import { Box, HStack, Text, VStack } from '@suite-native/atoms';
import {
    AddressFormatter,
    convertTokenValueToDecimal,
    ExactTokenAmountFormatter,
} from '@suite-native/formatters';
import { Translation } from '@suite-native/intl';
import { exhaustive } from '@trezor/type-utils';
import { useTransactionReview } from '../hooks/useTransactionReview';
import { TransactionReviewOutputHexData } from './TransactionReviewOutputHexData';
import { TransactionReviewOutputItemValues } from './TransactionReviewOutputItemValues';

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
                <TransactionReviewOutputItemValues
                    value={output.value}
                    translationKey="transactionManagement.review.outputs.amountLabel"
                />
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
        case 'regular_legacy': {
            switch (review.flowType) {
                case 'approve':
                    return (
                        <Text variant="body-sm">
                            <Translation id="transactionManagement.review.outputs.tokenApprovalDescription" />
                        </Text>
                    );

                case 'revoke':
                case 'revoke-and-approve':
                    return (
                        <Text variant="body-sm">
                            <Translation id="transactionManagement.review.outputs.tokenRevocationDescription" />
                        </Text>
                    );

                case 'swap':
                case 'sign-data':
                case undefined:
                    return (
                        <AddressFormatter value={output.value} format="full" variant="body-sm" />
                    );

                default:
                    throw exhaustive(review.flowType);
            }
        }

        case 'contract':
            switch (review.flowType) {
                case 'approve':
                case 'revoke':
                case 'revoke-and-approve':
                    return <Text variant="body-sm">{output.value}</Text>;
                case 'swap':
                case 'sign-data':
                case undefined:
                    return (
                        <AddressFormatter value={output.value} format="full" variant="body-sm" />
                    );
                default:
                    throw exhaustive(review.flowType);
            }

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

        case 'approve_data': {
            const isApproveDataExchangeFlow =
                review.flowType === 'approve' ||
                review.flowType === 'revoke' ||
                review.flowType === 'revoke-and-approve';

            const isApprovalTx = review.flowType === 'approve';

            const isMaxApproval =
                typeof output.token?.decimals === 'number' &&
                isAllowanceUnlimited({
                    amount: output.value,
                    decimals: output.token.decimals,
                    isSubunit: true,
                });

            const getPrimaryValue = () => {
                if (!isApprovalTx && output.token?.symbol) {
                    return <Text variant="body-sm">{output.token.symbol}</Text>;
                }

                if (!isApprovalTx) {
                    return (
                        <Text variant="body-sm">
                            {isMaxApproval ? (
                                <Translation id="transactionManagement.review.outputs.approveMaxAmount" />
                            ) : (
                                output.value
                            )}
                        </Text>
                    );
                }

                if (isMaxApproval) {
                    return (
                        <Text variant="body-sm">
                            <Translation id="transactionManagement.review.outputs.approveMaxAmount" />
                        </Text>
                    );
                }

                if (!output.token) {
                    return <Text variant="body-sm">{output.value}</Text>;
                }

                return (
                    <ExactTokenAmountFormatter
                        variant="body-sm"
                        color="contentPrimary"
                        textAlign="right"
                        value={convertTokenValueToDecimal(output.value, output.token.decimals)}
                        tokenSymbol={output.token.symbol as TokenSymbol}
                        maxDisplayedDecimals={output.token.decimals}
                        isDiscreetText={false}
                    />
                );
            };

            if (!isApproveDataExchangeFlow) {
                console.warn(
                    `ReviewOutputItemContent: Unsupported output type "${output.type}" with value "${output.value}".`,
                );

                return null;
            }

            return (
                <VStack>
                    <HStack justifyContent="space-between">
                        <Text variant="body-sm">
                            <Translation
                                id={
                                    isApprovalTx
                                        ? 'transactionManagement.review.outputs.amountAllowanceLabel'
                                        : 'transactionManagement.review.outputs.tokenLabel'
                                }
                            />
                        </Text>

                        <Box flexShrink={1} alignItems="flex-end">
                            {getPrimaryValue()}
                        </Box>
                    </HStack>

                    {!!output.value2 && (
                        <HStack justifyContent="space-between">
                            <Text variant="body-sm">
                                <Translation id="transactionManagement.review.outputs.chainLabel" />
                            </Text>
                            <Text variant="body-sm">{output.value2}</Text>
                        </HStack>
                    )}
                </VStack>
            );
        }

        case 'data':
            return <TransactionReviewOutputHexData value={output.value} />;

        case 'recipient_name':
            return (
                <Text variant="body-sm" selectable>
                    {output.value}
                </Text>
            );

        case 'traded_assets': {
            if (!output.send) {
                return null;
            }

            // On a partial clear-signed swap the receive leg is absent (the device
            // attests only the send leg), so render send-only.
            const getReceiveDisplay = () => {
                if (!output.receive) {
                    return undefined;
                }

                return 'fiatCurrency' in output.receive
                    ? `${output.receive.amount} ${output.receive.fiatCurrency}`
                    : `${output.receive.amount} ${output.receive.symbol}`;
            };
            const receiveDisplay = getReceiveDisplay();

            return (
                <VStack spacing="sp12">
                    <Text variant="body-sm">
                        <Translation id="transactionManagement.review.outputs.tradedAssetsSendLabel" />
                        {` ${output.send.amount} ${output.send.symbol}`}
                    </Text>
                    {!!receiveDisplay && (
                        <Text variant="body-sm">
                            <Translation id="transactionManagement.review.outputs.tradedAssetsReceiveLabel" />
                            {` ${receiveDisplay}`}
                        </Text>
                    )}
                </VStack>
            );
        }

        case 'note':
            return <Text variant="body-sm">{output.value}</Text>;

        case 'fee-limit':
            return (
                <HStack>
                    <Box flex={0.4} justifyContent="center">
                        <Text variant="body-sm">
                            <Translation id="transactionManagement.review.outputs.feeLimitLabel" />
                        </Text>
                    </Box>
                    <Box flex={0.6} alignItems="flex-end">
                        <Text variant="body-sm">{Number(output.value).toLocaleString()} SUN</Text>
                    </Box>
                </HStack>
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
