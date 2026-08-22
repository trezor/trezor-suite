import { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import { selectSelectedDevice } from '@suite-common/device';
import {
    type FormDraftRootState,
    type StablecoinYieldActionReviewState,
    type StablecoinYieldRootState,
    type YieldWithdrawFlowType,
    getYieldWithdrawInputToken,
    selectFormDraft,
    selectStablecoinYieldSessionByFlowKey,
} from '@suite-common/wallet-core';
import { type FormState } from '@suite-common/wallet-types';
import {
    type StackNavigationProps,
    type YieldStackParamList,
    YieldStackRoutes,
} from '@suite-native/navigation';

import { YieldWithdrawReviewContent } from '../components/YieldWithdrawReviewContent';
import { useYieldFlowData } from '../hooks/useYieldFlowData';
import { buildYieldReviewPreview } from '../utils/yieldReviewOutputUtils';
import { getSelectedEvmFeeFromFormDraft } from '../utils/yieldSelectedFeeUtils';
import { getYieldWithdrawFormDraftKey } from '../utils/yieldWithdrawUtils';

type RouteProps = RouteProp<YieldStackParamList, YieldStackRoutes.YieldWithdrawReview>;
type NavigationProps = StackNavigationProps<
    YieldStackParamList,
    YieldStackRoutes.YieldWithdrawReview
>;
type YieldWithdrawScreenReview = StablecoinYieldActionReviewState & {
    type: YieldWithdrawFlowType;
};

const isYieldWithdrawScreenReview = (
    actionReview: StablecoinYieldActionReviewState | null | undefined,
    flowType: YieldWithdrawFlowType,
): actionReview is YieldWithdrawScreenReview => actionReview?.type === flowType;

export const YieldWithdrawReviewScreen = () => {
    const route = useRoute<RouteProps>();
    const navigation = useNavigation<NavigationProps>();

    const yieldFlowData = useYieldFlowData(route.params);
    const { flowData, flowKey, resolutionStatus, vaultName } = yieldFlowData;

    const device = useSelector(selectSelectedDevice);
    const flowType = route.params.withdrawFlowType ?? 'withdraw';
    const session = useSelector((state: StablecoinYieldRootState) =>
        selectStablecoinYieldSessionByFlowKey(state, flowType, flowKey),
    );
    const formDraftKey = flowKey ? getYieldWithdrawFormDraftKey(flowKey) : '';
    const formDraft = useSelector((state: FormDraftRootState) =>
        formDraftKey ? selectFormDraft<FormState>(state, formDraftKey) : undefined,
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
    const selectedFee = useMemo(() => getSelectedEvmFeeFromFormDraft(formDraft), [formDraft]);
    const preview = useMemo(() => {
        if (!review || !device || !flowData || !reviewToken || !selectedFee || vaultName === null) {
            return null;
        }

        return buildYieldReviewPreview({
            device,
            flowData,
            review,
            reviewToken,
            selectedFee,
            type: 'withdraw',
            vaultName,
        });
    }, [device, flowData, review, reviewToken, selectedFee, vaultName]);

    useEffect(() => {
        if (resolutionStatus !== 'resolved') {
            return;
        }

        if (session?.step === 'complete') {
            navigation.replace(YieldStackRoutes.YieldWithdrawComplete, route.params);

            return;
        }

        if (!review || !selectedFee || session?.step !== 'action') {
            navigation.navigate(YieldStackRoutes.YieldWithdraw, route.params);
        }
    }, [navigation, resolutionStatus, review, route.params, selectedFee, session?.step]);

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
