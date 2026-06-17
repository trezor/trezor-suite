import { useSelector } from 'react-redux';

import { type RouteProp, useRoute } from '@react-navigation/native';

import { selectSelectedDevice } from '@suite-common/device';
import { type YieldStackParamList, YieldStackRoutes } from '@suite-native/navigation';

import { YieldDepositApprovalReviewContent } from '../components/YieldDepositApprovalReviewContent';
import { useResolvedYieldFlowData } from '../hooks/useResolvedYieldFlowData';

type ApprovalReviewRouteProps = RouteProp<
    YieldStackParamList,
    YieldStackRoutes.YieldDepositApprovalReview
>;
type RevokeReviewRouteProps = RouteProp<
    YieldStackParamList,
    YieldStackRoutes.YieldDepositRevokeReview
>;
type RouteProps = ApprovalReviewRouteProps | RevokeReviewRouteProps;

export const YieldDepositApprovalTransactionDataReviewScreen = () => {
    const route = useRoute<RouteProps>();
    const { flowData, flowKey, resolutionStatus } = useResolvedYieldFlowData(route.params);
    const device = useSelector(selectSelectedDevice);
    const isRevokeReview = route.name === YieldStackRoutes.YieldDepositRevokeReview;
    const transactionType = isRevokeReview ? 'revoke' : 'approve';
    const approvalLimitType = isRevokeReview ? undefined : route.params.approvalLimitType;

    if (resolutionStatus !== 'resolved' || !device) {
        return null;
    }

    return (
        <YieldDepositApprovalReviewContent
            approvalLimitType={approvalLimitType}
            device={device}
            flowData={flowData}
            flowKey={flowKey}
            transactionType={transactionType}
        />
    );
};
