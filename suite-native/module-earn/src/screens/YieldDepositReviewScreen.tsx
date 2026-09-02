import { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import { selectSelectedDevice } from '@suite-common/device';
import { type YieldRootState, selectYieldSessionByFlowKey } from '@suite-common/wallet-core';
import {
    type StackNavigationProps,
    type YieldStackParamList,
    YieldStackRoutes,
} from '@suite-native/navigation';

import { YieldDepositReviewContent } from '../components/YieldDepositReviewContent';
import { useYieldFlowData } from '../hooks/useYieldFlowData';
import { buildYieldReviewPreview } from '../utils/yieldReviewOutputUtils';

type RouteProps = RouteProp<YieldStackParamList, YieldStackRoutes.YieldDepositReview>;
type NavigationProps = StackNavigationProps<
    YieldStackParamList,
    YieldStackRoutes.YieldDepositReview
>;

export const YieldDepositReviewScreen = () => {
    const route = useRoute<RouteProps>();
    const navigation = useNavigation<NavigationProps>();
    const yieldFlowData = useYieldFlowData(route.params);
    const { flowData, flowKey, resolutionStatus, vaultName } = yieldFlowData;
    const device = useSelector(selectSelectedDevice);
    const session = useSelector((state: YieldRootState) =>
        selectYieldSessionByFlowKey(state, 'deposit', flowKey),
    );

    const actionReview = session?.action.review;
    const review = useMemo(
        () =>
            actionReview?.type === 'deposit'
                ? {
                      ...actionReview,
                      type: 'deposit' as const,
                  }
                : null,
        [actionReview],
    );
    const preview = useMemo(() => {
        if (!review || !device || !flowData || vaultName === null) {
            return null;
        }

        return buildYieldReviewPreview({
            device,
            flowData,
            review,
            type: 'deposit',
            vaultName,
        });
    }, [device, flowData, review, vaultName]);

    useEffect(() => {
        if (resolutionStatus !== 'resolved') {
            return;
        }

        if (session?.step === 'complete') {
            navigation.replace(YieldStackRoutes.YieldDepositComplete, route.params);

            return;
        }

        if (!review || session?.step !== 'action') {
            navigation.navigate(YieldStackRoutes.YieldDeposit, route.params);
        }
    }, [navigation, resolutionStatus, review, route.params, session?.step]);

    if (resolutionStatus !== 'resolved' || !flowData || !review || !preview) {
        return null;
    }

    return <YieldDepositReviewContent flowData={flowData} flowKey={flowKey} preview={preview} />;
};
