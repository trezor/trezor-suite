import { useCallback, useEffect, useRef } from 'react';

import { type RouteProp, useRoute } from '@react-navigation/native';

import { type YieldFlowResolvedData } from '@suite-common/wallet-core';
import { Text, VStack } from '@suite-native/atoms';
import {
    ConfirmOnTrezorWrapper,
    useConfirmOnTrezorController,
} from '@suite-native/confirm-on-trezor';
import { Translation } from '@suite-native/intl';
import { ScreenHeader, type YieldStackParamList, YieldStackRoutes } from '@suite-native/navigation';

import { EarnReviewSubmittedCard } from '../components/EarnReviewSubmittedCard';
import { YieldAllowanceReviewOutputList } from '../components/YieldAllowanceReviewOutputList';
import { useResolvedYieldFlowData } from '../hooks/useResolvedYieldFlowData';
import { useYieldApprovalReview } from '../hooks/useYieldApprovalReview';
import { useYieldReviewAutoStart } from '../hooks/useYieldReviewAutoStart';

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
};

const ApprovalReviewContent = ({ flowData, flowKey, route }: ApprovalReviewContentProps) => {
    const isRevokeReview = route.name === YieldStackRoutes.YieldDepositRevokeReview;
    const { confirmOnTrezorRef, revealConfirmOnTrezorSheet, closeSheet } =
        useConfirmOnTrezorController();
    const hasLeftReviewRef = useRef(false);
    const transactionType = isRevokeReview ? 'revoke' : 'approve';
    const approvalLimitType = isRevokeReview ? undefined : route.params.approvalLimitType;
    const successMessageTranslationId = isRevokeReview
        ? 'earn.yieldDepositRevokeReviewScreen.successMessage'
        : 'earn.yieldDepositApprovalReviewScreen.successMessage';
    const titleTranslationId = isRevokeReview
        ? 'earn.yieldDepositRevokeReviewScreen.title'
        : 'earn.yieldDepositApprovalReviewScreen.title';
    const markReviewLeave = useCallback(() => {
        hasLeftReviewRef.current = true;
    }, []);
    const {
        handleApprovalSubmitted,
        isApprovalSigned,
        isApprovalReviewReady,
        isSendingApproval,
        isSigningApproval,
        leaveReviewFromDeviceCancel,
        startApprovalReview,
    } = useYieldApprovalReview({
        approvalLimitType,
        flowData,
        flowKey,
        onReviewLeave: markReviewLeave,
        transactionType,
    });
    const handleReviewCancelled = useCallback(() => {
        if (hasLeftReviewRef.current) {
            return;
        }

        leaveReviewFromDeviceCancel();
    }, [leaveReviewFromDeviceCancel]);

    useYieldReviewAutoStart({
        onDeviceReviewReady: revealConfirmOnTrezorSheet,
        onReviewCancelled: handleReviewCancelled,
        onReviewFailed: closeSheet,
        shouldAutoStartReview: isApprovalReviewReady && !isSigningApproval,
        startReview: startApprovalReview,
    });

    useEffect(() => {
        if (isApprovalSigned) {
            closeSheet();
        }
    }, [closeSheet, isApprovalSigned]);

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
                <YieldAllowanceReviewOutputList
                    accountKey={flowData.account.key}
                    flowType={transactionType}
                    tokenContract={route.params.tokenContract}
                />
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
    const { flowData, flowKey, resolutionStatus } = useResolvedYieldFlowData(route.params);

    if (resolutionStatus !== 'resolved') {
        return null;
    }

    return <ApprovalReviewContent flowData={flowData} flowKey={flowKey} route={route} />;
};
