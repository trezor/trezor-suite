import { type ReactNode } from 'react';
import { type LayoutChangeEvent, View } from 'react-native';

import { type TokenSymbol } from '@suite-common/wallet-types';
import { convertAmountSubunitsToUnits, isMaxAllowance } from '@suite-common/wallet-utils';
import { Box, HStack, Text, VStack } from '@suite-native/atoms';
import { CryptoAmountFormatter } from '@suite-native/formatters';
import { Translation } from '@suite-native/intl';
import { ReviewOutputCard, type StatefulReviewOutput } from '@suite-native/transaction-management';

export type YieldAllowanceReviewFlowType = 'approve' | 'revoke';

type YieldAllowanceReviewOutputItemProps = {
    flowType: YieldAllowanceReviewFlowType;
    onLayout: (event: LayoutChangeEvent) => void;
    reviewOutput: StatefulReviewOutput;
};

type ApprovalDataOutputContentProps = {
    flowType: YieldAllowanceReviewFlowType;
    reviewOutput: StatefulReviewOutput;
};

type YieldAllowanceReviewOutputContentProps = {
    flowType: YieldAllowanceReviewFlowType;
    reviewOutput: StatefulReviewOutput;
};

const getAllowanceReviewOutputTitle = (
    type: StatefulReviewOutput['type'],
    flowType: YieldAllowanceReviewFlowType,
): ReactNode => {
    if (type === 'address' || type === 'regular_legacy') {
        return flowType === 'revoke' ? (
            <Translation id="transactionManagement.review.outputs.tokenRevocationLabel" />
        ) : (
            <Translation id="transactionManagement.review.outputs.tokenApprovalLabel" />
        );
    }

    if (type === 'contract') {
        return flowType === 'revoke' ? (
            <Translation id="transactionManagement.review.outputs.revokeApprovalFromLabel" />
        ) : (
            <Translation id="transactionManagement.review.outputs.approveToLabel" />
        );
    }

    if (type === 'approve_data') {
        return flowType === 'revoke' ? (
            <Translation id="transactionManagement.review.outputs.revokeLabel" />
        ) : (
            <Translation id="transactionManagement.review.outputs.approveLabel" />
        );
    }

    return type;
};

const ApprovalDataOutputContent = ({ flowType, reviewOutput }: ApprovalDataOutputContentProps) => {
    const { token, value, value2 } = reviewOutput;
    const isApprovalFlow = flowType === 'approve';
    const isMaxApproval = isMaxAllowance(value);

    const primaryValue = (() => {
        if (!isApprovalFlow && token?.symbol) {
            return <Text variant="body-sm">{token.symbol}</Text>;
        }

        if (isMaxApproval) {
            return (
                <Text variant="body-sm">
                    <Translation id="transactionManagement.review.outputs.approveMaxAmount" />
                </Text>
            );
        }

        if (!isApprovalFlow || !token) {
            return <Text variant="body-sm">{value}</Text>;
        }

        return (
            <CryptoAmountFormatter
                variant="body-sm"
                color="contentPrimary"
                textAlign="right"
                value={convertAmountSubunitsToUnits(value, token.decimals)}
                symbol={token.symbol as TokenSymbol}
                decimals={token.decimals}
                isDiscreetText={false}
            />
        );
    })();

    return (
        <VStack>
            <HStack justifyContent="space-between">
                <Text variant="body-sm">
                    <Translation
                        id={
                            isApprovalFlow
                                ? 'transactionManagement.review.outputs.amountAllowanceLabel'
                                : 'transactionManagement.review.outputs.tokenLabel'
                        }
                    />
                </Text>
                <Box flexShrink={1} alignItems="flex-end">
                    {primaryValue}
                </Box>
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
};

const YieldAllowanceReviewOutputContent = ({
    flowType,
    reviewOutput,
}: YieldAllowanceReviewOutputContentProps) => {
    const { type, value } = reviewOutput;

    if (type === 'address' || type === 'regular_legacy') {
        return flowType === 'revoke' ? (
            <Text variant="body-sm">
                <Translation id="transactionManagement.review.outputs.tokenRevocationDescription" />
            </Text>
        ) : (
            <Text variant="body-sm">
                <Translation id="transactionManagement.review.outputs.tokenApprovalDescription" />
            </Text>
        );
    }

    if (type === 'contract') {
        return <Text variant="body-sm">{value}</Text>;
    }

    if (type === 'approve_data') {
        return <ApprovalDataOutputContent flowType={flowType} reviewOutput={reviewOutput} />;
    }

    return <Text variant="body-sm">{value}</Text>;
};

export const YieldAllowanceReviewOutputItem = ({
    flowType,
    onLayout,
    reviewOutput,
}: YieldAllowanceReviewOutputItemProps) => {
    const { state, type } = reviewOutput;

    return (
        <View onLayout={onLayout}>
            <ReviewOutputCard
                title={getAllowanceReviewOutputTitle(type, flowType)}
                outputState={state}
            >
                <YieldAllowanceReviewOutputContent
                    flowType={flowType}
                    reviewOutput={reviewOutput}
                />
            </ReviewOutputCard>
        </View>
    );
};
