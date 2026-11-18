import { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import { selectSelectedDevice } from '@suite-common/device';
import {
    type YieldActionReviewState,
    type YieldRootState,
    type YieldWithdrawFlowType,
    getYieldWithdrawInputToken,
    selectYieldSessionByFlowKey,
} from '@suite-common/wallet-core';
import { useYieldFlowData } from '@suite-native/earn';
import {
    type StackNavigationProps,
    type YieldStackParamList,
    YieldStackRoutes,
} from '@suite-native/navigation';

import { YieldWithdrawReviewContent } from '../../components/yield/YieldWithdrawReviewContent';
import { buildYieldReviewPreview } from '../../utils/yield/yieldReviewOutputUtils';

type RouteProps = RouteProp<YieldStackParamList, YieldStackRoutes.YieldWithdrawReview>;
type NavigationProps = StackNavigationProps<
    YieldStackParamList,
    YieldStackRoutes.YieldWithdrawReview
>;
type YieldWithdrawScreenReview = YieldActionReviewState & {
    type: YieldWithdrawFlowType;
};

const isYieldWithdrawScreenReview = (
    actionReview: YieldActionReviewState | null | undefined,
    flowType: YieldWithdrawFlowType,
): actionReview is YieldWithdrawScreenReview => actionReview?.type === flowType;

export const YieldWithdrawReviewScreen = () => {
    const route = useRoute<RouteProps>();
    const navigation = useNavigation<NavigationProps>();

    const yieldFlowData = useYieldFlowData(route.params);
    const { flowData, flowKey, resolutionStatus, vaultName } = yieldFlowData;

    const device = useSelector(selectSelectedDevice);
    const flowType = route.params.withdrawFlowType ?? 'withdraw';
    const session = useSelector((state: YieldRootState) =>
        selectYieldSessionByFlowKey(state, flowType, flowKey),
    );

    const actionReview = session?.action.review;
    const review = useMemo(
        () => (isYieldWithdrawScreenReview(actionReview, flowType) ? actionReview : null),
        [actionReview, flowType],
    );
    const reviewToken = useMemo(() => {
        if (!flowData) {
            return null;
        }

        return getYieldWithdrawInputToken({ flowData, flowType });
    }, [flowData, flowType]);
    const preview = useMemo(() => {
        if (!review || !device || !flowData || !reviewToken || vaultName === null) {
            return null;
        }

        return buildYieldReviewPreview({
            device,
            flowData,
            review,
            reviewToken,
            type: 'withdraw',
            vaultName,
        });
    }, [device, flowData, review, reviewToken, vaultName]);

    useEffect(() => {
        if (resolutionStatus !== 'resolved') {
            return;
        }

        if (session?.step === 'complete') {
            navigation.replace(YieldStackRoutes.YieldWithdrawComplete, route.params);

            return;
        }

        if (!review || session?.step !== 'action') {
            navigation.navigate(YieldStackRoutes.YieldWithdraw, route.params);
        }
    }, [navigation, resolutionStatus, review, route.params, session?.step]);

    if (resolutionStatus !== 'resolved' || !flowData || !review || !reviewToken || !preview) {
        return null;
    }

    return (
        <YieldWithdrawReviewContent
            flowData={flowData}
            flowKey={flowKey}
            flowType={flowType}
            preview={preview}
            reviewToken={reviewToken}
        />
    );
};
