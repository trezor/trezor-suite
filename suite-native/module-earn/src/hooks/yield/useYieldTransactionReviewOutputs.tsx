import { useCallback } from 'react';

import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import {
    type Account,
    type TokenSymbol,
    type TransactionReviewStatefulOutput,
    toTokenAddress,
} from '@suite-common/wallet-types';
import { isAllowanceUnlimited } from '@suite-common/wallet-utils';
import { Box, HStack, Text, VStack } from '@suite-native/atoms';
import {
    AddressFormatter,
    ExactTokenAmountFormatter,
    convertTokenValueToDecimal,
} from '@suite-native/formatters';
import { Translation, type TxKeyPath } from '@suite-native/intl';
import {
    TransactionReviewOutputHexData,
    TransactionReviewOutputItemValues,
} from '@suite-native/transaction-review';
import { getWrappedNativeSymbol } from '@trezor/network-ethereum-suite-common';

import {
    type YieldApprovalReviewEvmTransactionPurpose,
    type YieldReviewEvmTransactionPurpose,
    isYieldApprovalReviewPurpose,
} from '../../utils/yield/yieldReviewOutputUtils';

type YieldContentReviewEvmTransactionPurpose = Exclude<
    YieldReviewEvmTransactionPurpose,
    YieldApprovalReviewEvmTransactionPurpose
>;
type YieldActionReviewEvmTransactionPurpose = Exclude<
    YieldContentReviewEvmTransactionPurpose,
    'claim'
>;

type YieldActionOutputMessages = {
    addressTitle: TxKeyPath;
    amountLabel: TxKeyPath;
    description: TxKeyPath;
    title: TxKeyPath;
};

const yieldActionOutputMessages = {
    deposit: {
        addressTitle: 'earn.yieldReview.outputs.depositTo',
        amountLabel: 'earn.yieldReview.outputs.depositAmount',
        description: 'earn.yieldReview.outputs.depositDescription',
        title: 'earn.yieldReview.outputs.depositTitle',
    },
    withdraw: {
        addressTitle: 'earn.yieldReview.outputs.withdrawFrom',
        amountLabel: 'earn.yieldReview.outputs.withdrawAmount',
        description: 'earn.yieldReview.outputs.withdrawDescription',
        title: 'earn.yieldReview.outputs.withdrawTitle',
    },
    redeem: {
        addressTitle: 'earn.yieldReview.outputs.redeemFrom',
        amountLabel: 'earn.yieldReview.outputs.redeemAmount',
        description: 'earn.yieldReview.outputs.redeemDescription',
        title: 'earn.yieldReview.outputs.redeemTitle',
    },
    wrap: {
        addressTitle: 'earn.yieldReview.outputs.wrapTo',
        amountLabel: 'earn.yieldReview.outputs.wrapAmount',
        description: 'earn.yieldReview.outputs.wrapDescription',
        title: 'earn.yieldReview.outputs.wrapTitle',
    },
    unwrap: {
        addressTitle: 'earn.yieldReview.outputs.unwrapFrom',
        amountLabel: 'earn.yieldReview.outputs.unwrapAmount',
        description: 'earn.yieldReview.outputs.unwrapDescription',
        title: 'earn.yieldReview.outputs.unwrapTitle',
    },
} satisfies Record<YieldActionReviewEvmTransactionPurpose, YieldActionOutputMessages>;

const wrappedNativeIntentMessages = {
    wrap: 'earn.yieldReview.outputs.wrapIntent',
    unwrap: 'earn.yieldReview.outputs.unwrapIntent',
} satisfies Record<'wrap' | 'unwrap', TxKeyPath>;

interface UseYieldTransactionReviewOutputsProps {
    evmTransactionPurpose: YieldReviewEvmTransactionPurpose;
    account: Account;
}

export const useYieldTransactionReviewOutputs = ({
    evmTransactionPurpose,
    account,
}: UseYieldTransactionReviewOutputsProps) => {
    const getOutputTitle = useCallback(
        (output: TransactionReviewStatefulOutput) => {
            const { type } = output;

            if (isYieldApprovalReviewPurpose(evmTransactionPurpose)) {
                switch (type) {
                    case 'address': {
                        switch (evmTransactionPurpose) {
                            case 'approve':
                                return (
                                    <Translation id="transactionManagement.review.outputs.tokenApprovalLabel" />
                                );
                            case 'revoke':
                                return (
                                    <Translation id="transactionManagement.review.outputs.tokenRevocationLabel" />
                                );
                            default:
                                return;
                        }
                    }
                    case 'approve_data': {
                        return (
                            <Translation id="transactionManagement.review.outputs.approveLabel" />
                        );
                    }
                    case 'contract': {
                        switch (evmTransactionPurpose) {
                            case 'approve':
                                return (
                                    <Translation id="transactionManagement.review.outputs.approveToLabel" />
                                );
                            case 'revoke':
                                return (
                                    <Translation id="transactionManagement.review.outputs.revokeApprovalFromLabel" />
                                );
                            default:
                                return;
                        }
                    }
                    default: {
                        return null;
                    }
                }
            }

            if (type === 'rewards') {
                return <Translation id="earn.yieldReview.outputs.rewardTokens" />;
            }

            if (type === 'contract') {
                return <Translation id="moduleAccountManagement.tokenSettings.contractAddress" />;
            }

            if (evmTransactionPurpose === 'claim') {
                return <Translation id="earn.yieldReview.outputs.claimTitle" />;
            }

            const messages = yieldActionOutputMessages[evmTransactionPurpose];

            switch (type) {
                case 'data':
                    return <Translation id={messages.title} />;
                case 'address':
                case 'regular_legacy':
                    return <Translation id={messages.addressTitle} />;
                case 'amount':
                    return <Translation id="transactionManagement.review.outputs.amountLabel" />;
                case 'recipient_name':
                    return <Translation id="earn.yieldReview.outputs.providerTitle" />;
                case 'contract_intent':
                    return <Translation id="earn.yieldReview.outputs.intentTitle" />;
                default:
                    return null;
            }
        },
        [evmTransactionPurpose],
    );

    const getOutputValue = useCallback(
        (output: TransactionReviewStatefulOutput) => {
            switch (output.type) {
                case 'data': {
                    if (evmTransactionPurpose === 'claim') {
                        return <TransactionReviewOutputHexData value={output.value} />;
                    }

                    return (
                        <Text variant="body-sm">
                            <Translation
                                id={
                                    yieldActionOutputMessages[
                                        evmTransactionPurpose as YieldActionReviewEvmTransactionPurpose
                                    ].description
                                }
                            />
                        </Text>
                    );
                }
                case 'address': {
                    switch (evmTransactionPurpose) {
                        case 'approve':
                            return (
                                <Text variant="body-sm">
                                    <Translation id="transactionManagement.review.outputs.tokenApprovalDescription" />
                                </Text>
                            );
                        case 'revoke':
                            return (
                                <Text variant="body-sm">
                                    <Translation id="transactionManagement.review.outputs.tokenRevocationDescription" />
                                </Text>
                            );
                        default:
                            return <Text variant="body-sm">{output.value}</Text>;
                    }
                }
                case 'recipient_name':
                case 'regular_legacy':
                    return <Text variant="body-sm">{output.value}</Text>;
                case 'contract_intent': {
                    if (!account) return;
                    if (evmTransactionPurpose !== 'wrap' && evmTransactionPurpose !== 'unwrap')
                        return;

                    const nativeSymbol = getNetworkDisplaySymbol(account.symbol);
                    const tokenSymbol = getWrappedNativeSymbol(account.symbol) ?? '';

                    return (
                        <Text variant="body-sm">
                            <Translation
                                id={wrappedNativeIntentMessages[evmTransactionPurpose]}
                                values={{ nativeSymbol, tokenSymbol }}
                            />
                        </Text>
                    );
                }
                case 'contract': {
                    switch (evmTransactionPurpose) {
                        case 'approve':
                        case 'revoke':
                            return <Text variant="body-sm">{output.value}</Text>;
                        default:
                            return (
                                <AddressFormatter
                                    value={output.value}
                                    format="full"
                                    variant="body-sm"
                                />
                            );
                    }
                }
                case 'amount': {
                    if (evmTransactionPurpose === 'claim') return;

                    const tokenContract = output.token?.contract
                        ? toTokenAddress(output.token.contract)
                        : undefined;

                    return (
                        <VStack spacing="sp16">
                            <TransactionReviewOutputItemValues
                                accountKey={account.key}
                                tokenContract={tokenContract}
                                value={output.value}
                                translationKey={
                                    yieldActionOutputMessages[
                                        evmTransactionPurpose as YieldActionReviewEvmTransactionPurpose
                                    ].amountLabel
                                }
                            />
                            {!!output.value2 && (
                                <HStack>
                                    <Box flex={0.4} justifyContent="center">
                                        <Text variant="body-sm">
                                            <Translation id="transactionManagement.review.outputs.chainLabel" />
                                        </Text>
                                    </Box>
                                    <Box flex={0.6} alignItems="flex-end">
                                        <Text variant="body-sm" textAlign="right">
                                            {output.value2}
                                        </Text>
                                    </Box>
                                </HStack>
                            )}
                        </VStack>
                    );
                }
                case 'approve_data': {
                    const isApprovalTx = evmTransactionPurpose === 'approve';

                    const isMaxApproval =
                        typeof output.token?.decimals === 'number' &&
                        isAllowanceUnlimited({
                            amount: output.value,
                            decimals: output.token?.decimals,
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
                                    output.token?.decimals,
                                )}
                                tokenSymbol={output.token?.symbol as TokenSymbol}
                                maxDisplayedDecimals={output.token?.decimals}
                                isDiscreetText={false}
                            />
                        );
                    };

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
                case 'rewards':
                    return (
                        <VStack spacing="sp12">
                            {output.rewards.map((reward, index) => (
                                <Text key={`${reward.tokenAddress}:${index}`} variant="body-sm">
                                    {reward.tokenSymbol || reward.tokenAddress}
                                </Text>
                            ))}
                        </VStack>
                    );
            }

            return undefined;
        },
        [evmTransactionPurpose, account],
    );

    return { getOutputTitle, getOutputValue };
};
