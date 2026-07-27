import { type ReactNode } from 'react';

import { type AccountKey, toTokenAddress } from '@suite-common/wallet-types';
import { Box, HStack, Text, VStack } from '@suite-native/atoms';
import { AddressFormatter } from '@suite-native/formatters';
import { Translation, type TxKeyPath } from '@suite-native/intl';
import { ReviewOutputHexData, ReviewOutputItemValues } from '@suite-native/transaction-management';
import { exhaustive } from '@trezor/type-utils';

import {
    type YieldApprovalReviewEvmTransactionPurpose,
    type YieldReviewEvmTransactionPurpose,
    type YieldTransactionReviewOutput,
} from '../utils/yieldReviewOutputUtils';

type YieldContentReviewEvmTransactionPurpose = Exclude<
    YieldReviewEvmTransactionPurpose,
    YieldApprovalReviewEvmTransactionPurpose
>;
type YieldActionReviewEvmTransactionPurpose = Exclude<
    YieldContentReviewEvmTransactionPurpose,
    'claim'
>;

type YieldTransactionReviewOutputContentProps = {
    accountKey: AccountKey;
    evmTransactionPurpose: YieldContentReviewEvmTransactionPurpose;
    reviewOutput: YieldTransactionReviewOutput;
};

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
} satisfies Record<YieldActionReviewEvmTransactionPurpose, YieldActionOutputMessages>;

export const getYieldTransactionReviewOutputTitle = ({
    evmTransactionPurpose,
    reviewOutput,
}: Pick<
    YieldTransactionReviewOutputContentProps,
    'evmTransactionPurpose' | 'reviewOutput'
>): ReactNode => {
    const { type } = reviewOutput;

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
        default:
            return exhaustive(type);
    }
};

export const YieldTransactionReviewOutputContent = ({
    accountKey,
    evmTransactionPurpose,
    reviewOutput,
}: YieldTransactionReviewOutputContentProps) => {
    switch (reviewOutput.type) {
        case 'data':
            if (evmTransactionPurpose === 'claim') {
                return <ReviewOutputHexData value={reviewOutput.value} />;
            }

            return (
                <Text variant="body-sm">
                    <Translation
                        id={yieldActionOutputMessages[evmTransactionPurpose].description}
                    />
                </Text>
            );
        case 'address':
        case 'regular_legacy':
            return <Text variant="body-sm">{reviewOutput.value}</Text>;
        case 'contract':
            return <AddressFormatter value={reviewOutput.value} format="full" variant="body-sm" />;
        case 'amount': {
            if (evmTransactionPurpose === 'claim') {
                return null;
            }

            const tokenContract = reviewOutput.token?.contract
                ? toTokenAddress(reviewOutput.token.contract)
                : undefined;

            return (
                <VStack spacing="sp16">
                    <ReviewOutputItemValues
                        accountKey={accountKey}
                        tokenContract={tokenContract}
                        value={reviewOutput.value}
                        translationKey={
                            yieldActionOutputMessages[evmTransactionPurpose].amountLabel
                        }
                    />
                    {!!reviewOutput.value2 && (
                        <HStack>
                            <Box flex={0.4} justifyContent="center">
                                <Text variant="body-sm">
                                    <Translation id="transactionManagement.review.outputs.chainLabel" />
                                </Text>
                            </Box>
                            <Box flex={0.6} alignItems="flex-end">
                                <Text variant="body-sm" textAlign="right">
                                    {reviewOutput.value2}
                                </Text>
                            </Box>
                        </HStack>
                    )}
                </VStack>
            );
        }
        case 'rewards':
            return (
                <VStack spacing="sp12">
                    {reviewOutput.rewards.map((reward, index) => (
                        <Text key={`${reward.tokenAddress}:${index}`} variant="body-sm">
                            {reward.tokenSymbol || reward.tokenAddress}
                        </Text>
                    ))}
                </VStack>
            );
        default:
            return exhaustive(reviewOutput);
    }
};
