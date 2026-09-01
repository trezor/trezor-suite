import { useCallback } from 'react';

import { useIsFocused, useNavigation } from '@react-navigation/native';

import { type YieldDtoV2 } from '@suite-common/earn-stablecoin-api';
import { useDispatch } from '@suite-common/redux-utils';
import {
    type WrappedNativeFlowType,
    type YieldFlowType,
    stablecoinYieldActions,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { useNavigateToInitialScreen } from '@suite-native/navigation';

import { useShowYieldTransactionFailureAlert } from './useShowYieldTransactionFailureAlert';
import {
    type PreparedWrappedNativeTokenAction,
    useWrappedNativeTokenFees,
} from './useWrappedNativeTokenFees';
import { useWrappedNativeTokenForm } from './useWrappedNativeTokenForm';
import { useWrappedNativeTxSimulation } from './useWrappedNativeTxSimulation';
import { useYieldPendingTransaction } from './useYieldPendingTransaction';
import { useYieldPendingTransactionTracking } from './useYieldPendingTransactionTracking';
import { useYieldSession } from './useYieldSession';

type UseYieldWrappedNativeStepParams = {
    account: Account | null;
    availableBalance: string;
    decimals: number;
    flowKey: string | null;
    flowType: YieldFlowType;
    isDisabled: boolean;
    isWrappedNativeVault: boolean;
    onNavigateToReview: () => void;
    onSkipAnalytics: () => void;
    onSubmitAnalytics: () => void;
    step: WrappedNativeFlowType;
    tokenSymbol: string;
    vault: YieldDtoV2 | null;
};

/** Wiring shared by the in-flow wrap (deposit) and unwrap (withdraw/redeem) step screens. */
export const useYieldWrappedNativeStep = ({
    account,
    availableBalance,
    decimals,
    flowKey,
    flowType,
    isDisabled,
    isWrappedNativeVault,
    onNavigateToReview,
    onSkipAnalytics,
    onSubmitAnalytics,
    step,
    tokenSymbol,
    vault,
}: UseYieldWrappedNativeStepParams) => {
    const dispatch = useDispatch();
    const isFocused = useIsFocused();
    const navigation = useNavigation();
    const navigateToInitialScreen = useNavigateToInitialScreen();

    const session = useYieldSession({
        flowKey,
        flowType,
        isWrappedNativeVault,
        shouldDisposeOnGoBack: true,
    });
    const isStepSessionReady = session?.step === step;

    const form = useWrappedNativeTokenForm({ availableBalance, decimals, tokenSymbol });
    const { amountValue } = form;
    const {
        formState: { isValid },
    } = form.form;

    const {
        displayedPendingTransaction,
        isSheetPresented,
        pendingBottomSheetRef,
        pendingModalProps,
        pendingTransaction,
    } = useYieldPendingTransaction({
        accountKey: account?.key,
        isFocused,
        pendingTransaction: session?.action.pendingTransaction,
        transactionType: step,
    });
    const isStepPending = !!pendingTransaction;
    const isAmountReady = isValid && !!amountValue;
    const isFeeSectionDisplayed = isAmountReady && !isStepPending;

    const fees = useWrappedNativeTokenFees({
        account,
        amount: amountValue,
        flowType: step,
        isEnabled: isFeeSectionDisplayed && isStepSessionReady,
    });

    useShowYieldTransactionFailureAlert({
        error: session?.error,
        flowKey,
        flowType,
        isEnabled: isFocused,
    });

    useYieldPendingTransactionTracking({
        account,
        flowKey,
        flowType,
        isScreenFocused: isFocused,
        pendingTransaction,
        vault,
    });

    const handleSkip = useCallback(() => {
        if (!flowKey || isStepPending) {
            return;
        }

        onSkipAnalytics();
        dispatch(stablecoinYieldActions.resolveWrappedNativeStep({ flowType, flowKey, step }));
    }, [dispatch, flowKey, flowType, isStepPending, onSkipAnalytics, step]);

    const handleSimulationConfirmed = useCallback(
        (preparedAction: PreparedWrappedNativeTokenAction) => {
            if (!flowKey) {
                return;
            }

            dispatch(
                stablecoinYieldActions.storeWrappedNativeReviewData({
                    flowType,
                    flowKey,
                    step,
                    amount: preparedAction.amount,
                    unsignedTransaction: preparedAction.unsignedTransaction,
                }),
            );
            onNavigateToReview();
        },
        [dispatch, flowKey, flowType, onNavigateToReview, step],
    );

    const simulation = useWrappedNativeTxSimulation({
        amountValue,
        isDisabled,
        onConfirm: handleSimulationConfirmed,
        onSubmit: onSubmitAnalytics,
        preparedAction: fees.preparedAction,
    });

    const handleClose = useCallback(() => {
        const isStepRemovedByPopToTop = (navigation.getState()?.routes.length ?? 0) > 1;

        navigateToInitialScreen();

        if (!isStepRemovedByPopToTop || !flowKey || isStepPending) {
            return;
        }

        dispatch(stablecoinYieldActions.disposeSession({ flowType, flowKey }));
    }, [dispatch, flowKey, flowType, isStepPending, navigateToInitialScreen, navigation]);

    return {
        amountValue,
        displayedPendingTransaction,
        fees,
        form,
        handleClose,
        handleSkip,
        isAmountReady,
        isFeeSectionDisplayed,
        isSheetPresented,
        isStepPending,
        isStepSessionReady,
        pendingBottomSheetRef,
        pendingModalProps,
        pendingTransaction,
        session,
        simulation,
    };
};
