import { useCallback } from 'react';

import {
    type AccountKey,
    type TokenAddress,
    type TokenSymbol,
    type TransactionReviewStatefulOutput,
} from '@suite-common/wallet-types';
import { isAllowanceUnlimited } from '@suite-common/wallet-utils';
import { Box, HStack, Text, VStack } from '@suite-native/atoms';
import {
    AddressFormatter,
    ExactTokenAmountFormatter,
    convertTokenValueToDecimal,
} from '@suite-native/formatters';
import { Translation } from '@suite-native/intl';
import { type ExchangeFlowType } from '@suite-native/navigation';
import { exhaustive } from '@trezor/type-utils';

import { type ContentBuilderFunction } from './reviewOutputs/useTradingContentBuilder';

interface UseTradingTransactionReviewOutputsProps {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
    flowType?: ExchangeFlowType;
    contentBuilder?: ContentBuilderFunction;
}

export const useTradingTransactionReviewOutputs = ({
    accountKey,
    tokenContract,
    flowType,
    contentBuilder,
}: UseTradingTransactionReviewOutputsProps) => {
    const getOutputTitle = useCallback(
        (output: TransactionReviewStatefulOutput) => {
            switch (output.type) {
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
                            return (
                                <Translation id="transactionManagement.review.outputs.addressLabel" />
                            );

                        default:
                            throw exhaustive(flowType);
                    }

                case 'contract':
                    switch (flowType) {
                        case 'approve':
                            return (
                                <Translation id="transactionManagement.review.outputs.approveToLabel" />
                            );

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
                            return (
                                <Translation id="transactionManagement.review.outputs.contractLabel" />
                            );

                        default:
                            throw exhaustive(flowType);
                    }
                case 'approve_data':
                    if (flowType === 'revoke' || flowType === 'revoke-and-approve') {
                        return (
                            <Translation id="transactionManagement.review.outputs.revokeLabel" />
                        );
                    }

                    return <Translation id="transactionManagement.review.outputs.approveLabel" />;
                default:
                    return undefined;
            }
        },
        [flowType],
    );

    const getOutputValue = useCallback(
        (output: TransactionReviewStatefulOutput) => {
            const tradedSend = output.type === 'traded_assets' ? output.send : undefined;
            const tradedReceive = output.type === 'traded_assets' ? output.receive : undefined;

            const contentBuilderResult =
                output.value !== undefined &&
                contentBuilder?.({
                    accountKey,
                    outputType: output.type,
                    value: output.value,
                    value2: output.value2,
                    token: output.token,
                    tokenContract,
                    flowType,
                    send: tradedSend,
                    receive: tradedReceive,
                });

            if (contentBuilderResult) {
                return contentBuilderResult;
            }

            switch (output.type) {
                case 'address':
                case 'regular_legacy':
                    switch (flowType) {
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
                                <AddressFormatter
                                    value={output.value}
                                    format="full"
                                    variant="body-sm"
                                />
                            );

                        default:
                            throw exhaustive(flowType);
                    }

                case 'contract':
                    switch (flowType) {
                        case 'approve':
                        case 'revoke':
                        case 'revoke-and-approve':
                            return <Text variant="body-sm">{output.value}</Text>;
                        case 'swap':
                        case 'sign-data':
                        case undefined:
                            return (
                                <AddressFormatter
                                    value={output.value}
                                    format="full"
                                    variant="body-sm"
                                />
                            );
                        default:
                            throw exhaustive(flowType);
                    }

                case 'approve_data': {
                    const isApproveDataExchangeFlow =
                        flowType === 'approve' ||
                        flowType === 'revoke' ||
                        flowType === 'revoke-and-approve';

                    const isApprovalTx = flowType === 'approve';

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
                                value={convertTokenValueToDecimal(
                                    output.value,
                                    output.token.decimals,
                                )}
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

                        return undefined;
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
                case 'traded_assets': {
                    if (!tradedSend) {
                        return null;
                    }

                    // On a partial clear-signed swap the receive leg is absent (the device
                    // attests only the send leg), so render send-only.
                    const getReceiveDisplay = () => {
                        if (!tradedReceive) {
                            return undefined;
                        }

                        return 'fiatCurrency' in tradedReceive
                            ? `${tradedReceive.amount} ${tradedReceive.fiatCurrency}`
                            : `${tradedReceive.amount} ${tradedReceive.symbol}`;
                    };
                    const receiveDisplay = getReceiveDisplay();

                    return (
                        <VStack spacing="sp12">
                            <Text variant="body-sm">
                                <Translation id="transactionManagement.review.outputs.tradedAssetsSendLabel" />
                                {` ${tradedSend.amount} ${tradedSend.symbol}`}
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

                default:
                    // TODO: handle other output types when are other coins supported (ETH feeGas etc.)
                    console.warn(
                        `ReviewOutputItemContent: Unsupported output type "${output.type}" with value "${output.value}".`,
                    );

                    return undefined;
            }
        },
        [flowType, accountKey, tokenContract, contentBuilder],
    );

    return { getOutputTitle, getOutputValue };
};
