import { type RouteProp, useRoute } from '@react-navigation/native';

import { type YieldFlowResolvedData } from '@suite-common/wallet-core';
import { type YieldStackParamList, YieldStackRoutes } from '@suite-native/navigation';

import { EarnReviewSubmittedCard } from '../components/EarnReviewSubmittedCard';
import { YieldAllowanceReviewOutputList } from '../components/YieldAllowanceReviewOutputList';
import { YieldReviewScreenLayout } from '../components/YieldReviewScreenLayout';
import { useResolvedYieldFlowData } from '../hooks/useResolvedYieldFlowData';
import { useYieldApprovalReview } from '../hooks/useYieldApprovalReview';
import {
    useYieldReviewScreenControls,
    useYieldReviewSheetAutoStart,
} from '../hooks/useYieldReviewScreenControls';

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
    const {
        closeSheet,
        confirmOnTrezorRef,
        hasLeftReview,
        markReviewLeave,
        revealConfirmOnTrezorSheet,
    } = useYieldReviewScreenControls();
    const transactionType = isRevokeReview ? 'revoke' : 'approve';
    const approvalLimitType = isRevokeReview ? undefined : route.params.approvalLimitType;
    const successMessageTranslationId = isRevokeReview
        ? 'earn.yieldDepositRevokeReviewScreen.successMessage'
        : 'earn.yieldDepositApprovalReviewScreen.successMessage';
    const titleTranslationId = isRevokeReview
        ? 'earn.yieldDepositRevokeReviewScreen.title'
        : 'earn.yieldDepositApprovalReviewScreen.title';
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

    useYieldReviewSheetAutoStart({
        closeSheet,
        hasLeftReview,
        isSigned: isApprovalSigned,
        leaveReviewFromDeviceCancel,
        revealConfirmOnTrezorSheet,
        shouldAutoStartReview: isApprovalReviewReady && !isSigningApproval,
        startReview: startApprovalReview,
    });

    return (
        <YieldReviewScreenLayout
            confirmOnTrezorRef={confirmOnTrezorRef}
            titleTranslationId={titleTranslationId}
            submittedCard={
                isApprovalSigned ? (
                    <EarnReviewSubmittedCard
                        buttonTranslationId="transactions.send"
                        isButtonLoading={isSendingApproval}
                        messageTranslationId={successMessageTranslationId}
                        onButtonPress={handleApprovalSubmitted}
                    />
                ) : undefined
            }
        >
            <YieldAllowanceReviewOutputList
                accountKey={flowData.account.key}
                flowType={transactionType}
                tokenContract={route.params.tokenContract}
            />
        </YieldReviewScreenLayout>
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
