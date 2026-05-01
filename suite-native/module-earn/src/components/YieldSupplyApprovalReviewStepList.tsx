import { useState } from 'react';
import { View } from 'react-native';

import { type AccountKey } from '@suite-common/wallet-types';
import { Button, HStack, Text, VStack } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import {
    LIST_VERTICAL_SPACING,
    ReviewOutputCard,
    ReviewOutputItemValues,
    SlidingFooterOverlay,
    useActiveStepOffset,
} from '@suite-native/transaction-management';

import { type YieldApprovalLimitType } from '../types';

type YieldSupplyApprovalReviewStepListProps = {
    accountKey: AccountKey;
    amount: string;
    approvalLimitType: YieldApprovalLimitType;
    fee?: string;
    isFooterVisible?: boolean;
    isSubmitDisabled?: boolean;
    isSubmitLoading?: boolean;
    onSubmit: () => void | Promise<void>;
    tokenSymbol: string;
};

const NUMBER_OF_STEPS = 2;

type DetailRowProps = {
    label: string;
    value: string;
};

const DetailRow = ({ label, value }: DetailRowProps) => (
    <HStack justifyContent="space-between" alignItems="center">
        <Text variant="body-sm">{label}</Text>
        <Text variant="body-sm" color="contentSecondary">
            {value}
        </Text>
    </HStack>
);

export const YieldSupplyApprovalReviewStepList = ({
    accountKey,
    amount,
    approvalLimitType,
    fee,
    isFooterVisible = true,
    isSubmitDisabled = false,
    isSubmitLoading = false,
    onSubmit,
    tokenSymbol,
}: YieldSupplyApprovalReviewStepListProps) => {
    const { translate } = useTranslate();
    const [stepIndex, setStepIndex] = useState(0);
    const { activeStepBottomOffset, handleReadListItemHeight } = useActiveStepOffset(stepIndex);
    const isLastStep = stepIndex === NUMBER_OF_STEPS - 1;

    const handlePrimaryAction = () => {
        if (isLastStep) {
            onSubmit();

            return;
        }

        setStepIndex(previousStepIndex => previousStepIndex + 1);
    };

    const actionTranslationId = isLastStep ? 'generic.buttons.continue' : 'generic.buttons.next';
    const approvalLimitTranslationId =
        approvalLimitType === 'per-supply'
            ? 'earn.yieldSupplyFlowScreen.perSupply'
            : 'earn.yieldSupplyFlowScreen.approvalLimitSheet.unlimited.title';

    return (
        <View>
            <VStack spacing={LIST_VERTICAL_SPACING}>
                <View onLayout={event => handleReadListItemHeight(event, 0)}>
                    <ReviewOutputCard
                        title={translate('earn.yieldSupplyApprovalReviewScreen.approvalCard.title')}
                        outputState={stepIndex > 0 ? 'success' : 'active'}
                    >
                        <Text variant="body-sm" color="contentSecondary">
                            {amount} {tokenSymbol}
                        </Text>
                    </ReviewOutputCard>
                </View>

                <View onLayout={event => handleReadListItemHeight(event, 1)}>
                    <ReviewOutputCard
                        title={translate('earn.yieldSupplyApprovalReviewScreen.detailsCard.title')}
                        outputState={stepIndex === 1 ? 'active' : undefined}
                    >
                        <VStack spacing="sp16">
                            <DetailRow
                                label={translate(
                                    'earn.yieldSupplyApprovalReviewScreen.detailsCard.amount',
                                )}
                                value={`${amount} ${tokenSymbol}`}
                            />
                            <DetailRow
                                label={translate(
                                    'earn.yieldSupplyApprovalReviewScreen.detailsCard.approvalLimit',
                                )}
                                value={translate(approvalLimitTranslationId)}
                            />
                            <ReviewOutputItemValues
                                accountKey={accountKey}
                                value={fee ?? '0'}
                                translationKey="transactionManagement.review.outputs.summary.maxFee"
                            />
                        </VStack>
                    </ReviewOutputCard>
                </View>
            </VStack>

            {isFooterVisible && (
                <SlidingFooterOverlay activeStepOffset={activeStepBottomOffset}>
                    <Button
                        isDisabled={isSubmitDisabled && isLastStep}
                        isLoading={isSubmitLoading && isLastStep}
                        onPress={handlePrimaryAction}
                    >
                        <Translation id={actionTranslationId} />
                    </Button>
                </SlidingFooterOverlay>
            )}
        </View>
    );
};
