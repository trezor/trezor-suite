import { useEffect } from 'react';

import { type RouteProp, useRoute } from '@react-navigation/native';

import { type YieldFlowResolvedData } from '@suite-common/wallet-core';
import { Text, VStack } from '@suite-native/atoms';
import {
    ConfirmOnTrezorWrapper,
    useConfirmOnTrezorController,
} from '@suite-native/confirm-on-trezor';
import { Translation, useTranslate } from '@suite-native/intl';
import {
    ScreenHeader,
    type YieldStackParamList,
    type YieldStackRoutes,
} from '@suite-native/navigation';

import { EarnReviewSubmittedCard } from '../components/EarnReviewSubmittedCard';
import { YieldReviewList } from '../components/YieldReviewList';
import { useResolvedYieldFlowData } from '../hooks/useResolvedYieldFlowData';
import { useYieldApprovalReview } from '../hooks/useYieldApprovalReview';

type RouteProps = RouteProp<YieldStackParamList, YieldStackRoutes.YieldDepositApprovalReview>;

type ApprovalReviewContentProps = {
    flowData: YieldFlowResolvedData;
    flowKey: string;
    route: RouteProps;
    tokenSymbol: string;
};

const ApprovalReviewContent = ({
    flowData,
    flowKey,
    route,
    tokenSymbol,
}: ApprovalReviewContentProps) => {
    const { confirmOnTrezorRef, revealConfirmOnTrezorSheet, closeSheet } =
        useConfirmOnTrezorController();
    const { translate } = useTranslate();
    const {
        fee,
        handleApprovalSubmitted,
        handleSubmitApprovalReview,
        isApprovalSigned,
        isPreparingApproval,
        isSendingApproval,
        isSigningApproval,
        isSubmitDisabled,
    } = useYieldApprovalReview({
        approvalLimitType: route.params.approvalLimitType,
        flowData,
        flowKey,
    });

    useEffect(() => {
        if (isSigningApproval) {
            revealConfirmOnTrezorSheet();
        } else {
            closeSheet();
        }
    }, [closeSheet, isSigningApproval, revealConfirmOnTrezorSheet]);

    const approvalLimitTranslationId =
        route.params.approvalLimitType === 'per-deposit'
            ? 'earn.yieldDepositFlowScreen.perDeposit'
            : 'earn.yieldDepositFlowScreen.approvalLimitSheet.unlimited.title';

    return (
        <ConfirmOnTrezorWrapper
            isManualControlEnabled
            controlRef={confirmOnTrezorRef}
            closeActionType="back"
            defaultHeader={
                <ScreenHeader
                    closeActionType="back"
                    customContent={
                        <Text variant="body-md-strong">
                            <Translation id="earn.yieldDepositApprovalReviewScreen.title" />
                        </Text>
                    }
                />
            }
        >
            <VStack flex={1} justifyContent="space-between">
                <YieldReviewList
                    accountKey={flowData.account.key}
                    amount={route.params.amount}
                    approvalLimit={translate(approvalLimitTranslationId)}
                    fee={fee}
                    isFooterVisible={!isSigningApproval && !isApprovalSigned}
                    isSubmitDisabled={isSubmitDisabled}
                    isSubmitLoading={isPreparingApproval || isSigningApproval}
                    onSubmit={handleSubmitApprovalReview}
                    tokenSymbol={tokenSymbol}
                    variant="approval"
                />
                {isApprovalSigned && (
                    <EarnReviewSubmittedCard
                        buttonTranslationId="transactions.send"
                        isButtonLoading={isSendingApproval}
                        messageTranslationId="earn.yieldDepositApprovalReviewScreen.successMessage"
                        onButtonPress={handleApprovalSubmitted}
                    />
                )}
            </VStack>
        </ConfirmOnTrezorWrapper>
    );
};

export const YieldDepositApprovalTransactionDataReviewScreen = () => {
    const route = useRoute<RouteProps>();
    const { flowData, flowKey, tokenSymbol, resolutionStatus } = useResolvedYieldFlowData(
        route.params,
    );

    if (resolutionStatus !== 'resolved') {
        return null;
    }

    return (
        <ApprovalReviewContent
            flowData={flowData}
            flowKey={flowKey}
            route={route}
            tokenSymbol={tokenSymbol}
        />
    );
};
