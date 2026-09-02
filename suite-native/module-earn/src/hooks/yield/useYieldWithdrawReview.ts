import { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { useDispatch } from '@suite-common/redux-utils';
import {
    type FormDraftRootState,
    type YieldFlowDisplayToken,
    type YieldFlowResolvedData,
    type YieldRootState,
    type YieldWithdrawFlowType,
    isYieldTxReviewForFlow,
    selectFormDraft,
    selectYieldTxReview,
} from '@suite-common/wallet-core';
import { type FormState } from '@suite-common/wallet-types';
import type {
    StackNavigationProps,
    YieldStackParamList,
    YieldStackRoutes,
} from '@suite-native/navigation';

import { useYieldReviewAnalytics } from './useYieldReviewAnalytics';
import {
    pushYieldActionReviewThunk,
    signYieldActionReviewThunk,
} from '../../thunks/yieldTransactionThunks';
import { getSelectedEvmFeeFromFormDraft } from '../../utils/yield/yieldSelectedFeeUtils';
import { getYieldWithdrawFormDraftKey } from '../../utils/yield/yieldWithdrawUtils';
import { useEarnTransactionReview } from '../earn/useEarnTransactionReview';

type NavigationProps = StackNavigationProps<
    YieldStackParamList,
    YieldStackRoutes.YieldWithdrawReview
>;

interface UseYieldWithdrawReviewProps {
    flowData: YieldFlowResolvedData;
    flowKey: string;
    flowType: YieldWithdrawFlowType;
    onReviewLeave?: () => void;
    reviewToken: YieldFlowDisplayToken;
}

export const useYieldWithdrawReview = ({
    flowData,
    flowKey,
    flowType,
    onReviewLeave,
    reviewToken,
}: UseYieldWithdrawReviewProps) => {
    const dispatch = useDispatch();
    const navigation = useNavigation<NavigationProps>();

    const { reportError: reportWithdrawError, reportCancel: reportWithdrawCancel } =
        useYieldReviewAnalytics({
            flow: 'withdraw',
            networkSymbol: flowData.account.symbol,
            vaultId: flowData.vault.id,
            operation: flowType,
        });

    const txReview = useSelector((state: YieldRootState) => selectYieldTxReview(state));

    const formDraftKey = getYieldWithdrawFormDraftKey(flowKey);
    const formDraft = useSelector((state: FormDraftRootState) =>
        selectFormDraft<FormState>(state, formDraftKey),
    );

    // A leftover signed tx from a previous review of the same account must not appear
    // as signed here, hence the flow identity and `notBefore` guard.
    const [reviewOpenedAt] = useState(() => Date.now());

    // The withdraw amount is signed with the fee the user picked on the form screen, unlike the
    // other yield actions, which sign the fee their compose step baked into the transaction.
    const selectedFee = useMemo(() => getSelectedEvmFeeFromFormDraft(formDraft), [formDraft]);

    const isWithdrawSigned =
        isYieldTxReviewForFlow(txReview, {
            accountKey: flowData.account.key,
            flowKey,
            flowType,
            notBefore: reviewOpenedAt,
        }) && !!txReview.serializedTx;

    const signAction = useCallback(
        () =>
            dispatch(
                signYieldActionReviewThunk({
                    flowData,
                    flowKey,
                    flowType,
                    reviewToken,
                    selectedFee,
                }),
            ),
        [dispatch, flowData, flowKey, flowType, reviewToken, selectedFee],
    );

    const pushAction = useCallback(
        () => dispatch(pushYieldActionReviewThunk({ flowData, flowKey, flowType })),
        [dispatch, flowData, flowKey, flowType],
    );

    const onPushSuccess = useCallback(() => navigation.goBack(), [navigation]);

    const review = useEarnTransactionReview({
        formType: 'yield-withdraw',
        isSigned: isWithdrawSigned,
        navigation,
        onPushSuccess,
        onReviewLeave,
        reportCancel: reportWithdrawCancel,
        reportError: reportWithdrawError,
        signAction,
        pushAction,
    });

    return {
        status: review.status,
        submit: review.handleSubmitted,
        startReview: review.startReview,
        leaveReviewFromDeviceCancel: review.leaveReviewFromDeviceCancel,
    };
};
