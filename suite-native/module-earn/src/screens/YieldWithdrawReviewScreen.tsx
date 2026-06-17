import { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import { selectSelectedDevice } from '@suite-common/device';
import {
    type FormDraftRootState,
    type StablecoinYieldRootState,
    selectFormDraft,
    selectStablecoinYieldSessionByFlowKey,
} from '@suite-common/wallet-core';
import { type FormState, isFinalPrecomposedTransaction } from '@suite-common/wallet-types';
import {
    type StackNavigationProps,
    type YieldStackParamList,
    YieldStackRoutes,
} from '@suite-native/navigation';
import { type NativeSendRootState, selectFeeLevels } from '@suite-native/transaction-management';

import { YieldWithdrawReviewContent } from '../components/YieldWithdrawReviewContent';
import { useResolvedYieldFlowData } from '../hooks/useResolvedYieldFlowData';
import { buildYieldReviewPreview } from '../utils/yieldReviewOutputUtils';
import { getSelectedEvmFeeFromPrecomposedTransaction } from '../utils/yieldSelectedFeeUtils';
import {
    getYieldWithdrawFormDraftKey,
    getYieldWithdrawInputToken,
} from '../utils/yieldWithdrawUtils';

type RouteProps = RouteProp<YieldStackParamList, YieldStackRoutes.YieldWithdrawReview>;
type NavigationProps = StackNavigationProps<
    YieldStackParamList,
    YieldStackRoutes.YieldWithdrawReview
>;

export const YieldWithdrawReviewScreen = () => {
    const route = useRoute<RouteProps>();
    const navigation = useNavigation<NavigationProps>();
    const { flowData, flowKey, resolutionStatus } = useResolvedYieldFlowData(route.params);
    const device = useSelector(selectSelectedDevice);
    const session = useSelector((state: StablecoinYieldRootState) =>
        selectStablecoinYieldSessionByFlowKey(state, 'withdraw', flowKey),
    );
    const formDraftKey = flowKey ? getYieldWithdrawFormDraftKey(flowKey) : '';
    const formDraft = useSelector((state: FormDraftRootState) =>
        formDraftKey ? selectFormDraft<FormState>(state, formDraftKey) : undefined,
    );
    const feeLevels = useSelector((state: NativeSendRootState) => selectFeeLevels(state));
    const actionReview = session?.action.review;
    const review = useMemo(
        () =>
            actionReview?.type === 'withdraw'
                ? {
                      ...actionReview,
                      type: 'withdraw' as const,
                  }
                : null,
        [actionReview],
    );
    const withdrawInputUnit = route.params.withdrawInputUnit ?? 'asset';
    const reviewToken = useMemo(() => {
        if (!flowData) {
            return null;
        }

        return getYieldWithdrawInputToken({ flowData, withdrawInputUnit });
    }, [flowData, withdrawInputUnit]);
    const selectedFeePreview = formDraft?.selectedFee
        ? feeLevels[formDraft.selectedFee]
        : undefined;
    const selectedFee = useMemo(
        () =>
            getSelectedEvmFeeFromPrecomposedTransaction(
                isFinalPrecomposedTransaction(selectedFeePreview) ? selectedFeePreview : undefined,
            ),
        [selectedFeePreview],
    );
    const preview = useMemo(() => {
        if (!review || !device || !flowData || !reviewToken) {
            return null;
        }

        return buildYieldReviewPreview({
            device,
            flowData,
            review,
            reviewToken,
            selectedFee,
            type: 'withdraw',
        });
    }, [device, flowData, review, reviewToken, selectedFee]);

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
            preview={preview}
            reviewToken={reviewToken}
        />
    );
};
