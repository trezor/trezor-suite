import { useEffect } from 'react';

import { type RouteProp, useRoute } from '@react-navigation/native';

import { type YieldFlowResolvedData } from '@suite-common/wallet-core';
import { Text, VStack } from '@suite-native/atoms';
import {
    ConfirmOnTrezorWrapper,
    useConfirmOnTrezorController,
} from '@suite-native/confirm-on-trezor';
import { Translation, useTranslate } from '@suite-native/intl';
import { ScreenHeader, type YieldStackParamList, YieldStackRoutes } from '@suite-native/navigation';

import { EarnReviewSubmittedCard } from '../components/EarnReviewSubmittedCard';
import { YieldReviewList } from '../components/YieldReviewList';
import { type YieldReviewListProps } from '../components/YieldReviewListPresets';
import { useResolvedYieldFlowData } from '../hooks/useResolvedYieldFlowData';
import { useYieldApprovalReview } from '../hooks/useYieldApprovalReview';

type ApprovalReviewRouteProps = RouteProp<
    YieldStackParamList,
    YieldStackRoutes.YieldDepositApprovalReview
>;
type RevokeReviewRouteProps = RouteProp<
    YieldStackParamList,
    YieldStackRoutes.YieldDepositRevokeReview
>;
type RouteProps = ApprovalReviewRouteProps | RevokeReviewRouteProps;

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
    const isRevokeReview = route.name === YieldStackRoutes.YieldDepositRevokeReview;
    const { confirmOnTrezorRef, revealConfirmOnTrezorSheet, closeSheet } =
        useConfirmOnTrezorController();
    const { translate } = useTranslate();
    const reviewVariantProps = isRevokeReview
        ? ({
              approvalLimitType: undefined,
              isAmountUnlimited: route.params.isAmountUnlimited,
              successMessageTranslationId: 'earn.yieldDepositRevokeReviewScreen.successMessage',
              titleTranslationId: 'earn.yieldDepositRevokeReviewScreen.title',
              transactionType: 'revoke',
              variant: 'revoke',
          } as const)
        : ({
              approvalLimit: translate(
                  route.params.approvalLimitType === 'per-deposit'
                      ? 'earn.yieldDepositFlowScreen.perDeposit'
                      : 'earn.yieldDepositFlowScreen.approvalLimitSheet.unlimited.title',
              ),
              approvalLimitType: route.params.approvalLimitType,
              successMessageTranslationId: 'earn.yieldDepositApprovalReviewScreen.successMessage',
              titleTranslationId: 'earn.yieldDepositApprovalReviewScreen.title',
              transactionType: 'approve',
              variant: 'approval',
          } as const);

    const {
        approvalLimitType,
        successMessageTranslationId,
        titleTranslationId,
        transactionType,
        ...reviewListVariantProps
    } = reviewVariantProps;
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
        approvalLimitType,
        flowData,
        flowKey,
        transactionType,
    });

    useEffect(() => {
        if (isSigningApproval) {
            revealConfirmOnTrezorSheet();
        } else {
            closeSheet();
        }
    }, [closeSheet, isSigningApproval, revealConfirmOnTrezorSheet]);

    const commonReviewListProps = {
        accountKey: flowData.account.key,
        amount: route.params.amount,
        fee,
        isFooterVisible: !isSigningApproval && !isApprovalSigned,
        isSubmitDisabled,
        isSubmitLoading: isPreparingApproval || isSigningApproval,
        onSubmit: handleSubmitApprovalReview,
        tokenSymbol,
    };
    const reviewListProps: YieldReviewListProps = {
        ...commonReviewListProps,
        ...reviewListVariantProps,
    };

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
                            <Translation id={titleTranslationId} />
                        </Text>
                    }
                />
            }
        >
            <VStack flex={1} justifyContent="space-between">
                <YieldReviewList {...reviewListProps} />
                {isApprovalSigned && (
                    <EarnReviewSubmittedCard
                        buttonTranslationId="transactions.send"
                        isButtonLoading={isSendingApproval}
                        messageTranslationId={successMessageTranslationId}
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
