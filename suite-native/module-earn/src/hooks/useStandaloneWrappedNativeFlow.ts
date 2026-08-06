import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { useIsFocused, useNavigation } from '@react-navigation/native';

import { selectIsDeviceConnected } from '@suite-common/device';
import {
    type WrappedNativeFlowType,
    type YieldPendingTransactionState,
    useWrappedNativePendingTx,
} from '@suite-common/wallet-core';
import { type Account, type AccountKey } from '@suite-common/wallet-types';
import { useBottomSheetModal } from '@suite-native/atoms';
import {
    type StackNavigationProps,
    type WrappedNativeTokenPendingTxParams,
    type WrappedNativeTokenStackParamList,
    type WrappedNativeTokenStackRoutes,
} from '@suite-native/navigation';

import { type PreparedWrappedNativeTokenAction } from './useWrappedNativeTokenFees';
import { useYieldPendingTransaction } from './useYieldPendingTransaction';
import { wrappedNativeTokenFlowRoutes } from '../utils/wrappedNativeTokenFlowRoutes';

type UseStandaloneWrappedNativeFlowParams = {
    account: Account | null;
    accountKey: AccountKey;
    amountValue: string | undefined;
    flowType: WrappedNativeFlowType;
    pendingParam: WrappedNativeTokenPendingTxParams | undefined;
    preparedAction: PreparedWrappedNativeTokenAction | null;
};

type NavigationProps = StackNavigationProps<
    WrappedNativeTokenStackParamList,
    WrappedNativeTokenStackRoutes.WrapNativeToken | WrappedNativeTokenStackRoutes.UnwrapNativeToken
>;

export const useStandaloneWrappedNativeFlow = ({
    account,
    accountKey,
    amountValue,
    flowType,
    pendingParam,
    preparedAction,
}: UseStandaloneWrappedNativeFlowParams) => {
    const navigation = useNavigation<NavigationProps>();
    const isFocused = useIsFocused();

    const [isDeviceNotConnectedVisible, setIsDeviceNotConnectedVisible] = useState(false);
    const [hasFlowFailed, setHasFlowFailed] = useState(false);
    const [preparedTx, setPreparedTx] = useState<PreparedWrappedNativeTokenAction | null>(null);

    const {
        bottomSheetRef: simulationBottomSheetRef,
        closeModal: closeSimulationBottomSheet,
        openModal: openSimulationBottomSheet,
    } = useBottomSheetModal();

    const isDeviceConnected = useSelector(selectIsDeviceConnected);

    const pendingStatus = useWrappedNativePendingTx(account, pendingParam?.txid ?? null, flowType);
    const pendingTransaction: YieldPendingTransactionState | null = useMemo(
        () =>
            pendingParam
                ? {
                      type: flowType,
                      txid: pendingParam.txid,
                      amount: pendingParam.amount,
                      fee: pendingParam.fee,
                      submittedAt: pendingParam.submittedAt,
                  }
                : null,
        [flowType, pendingParam],
    );
    const { pendingBottomSheetRef, pendingModalProps } = useYieldPendingTransaction({
        accountKey,
        isFocused,
        pendingTransaction,
        transactionType: flowType,
    });

    useEffect(() => {
        if (!pendingParam) {
            return;
        }

        if (pendingStatus === 'confirmed') {
            navigation.replace(wrappedNativeTokenFlowRoutes[flowType].complete, {
                accountKey,
                amount: pendingParam.amount,
                txid: pendingParam.txid,
            });

            return;
        }

        if (pendingStatus === 'failed') {
            setHasFlowFailed(true);
            navigation.setParams({ pendingTransaction: undefined });
        }
    }, [accountKey, flowType, navigation, pendingParam, pendingStatus]);

    const handleSubmit = useCallback(() => {
        if (preparedAction?.amount !== amountValue) {
            return;
        }

        setHasFlowFailed(false);
        setPreparedTx(preparedAction);
        requestAnimationFrame(openSimulationBottomSheet);
    }, [amountValue, openSimulationBottomSheet, preparedAction]);

    const handleConfirmSimulation = useCallback(() => {
        closeSimulationBottomSheet();

        if (!preparedTx) {
            return;
        }

        if (!isDeviceConnected) {
            setIsDeviceNotConnectedVisible(true);

            return;
        }

        setIsDeviceNotConnectedVisible(false);
        navigation.navigate(wrappedNativeTokenFlowRoutes[flowType].review, {
            accountKey,
            amount: preparedTx.amount,
            unsignedTransaction: preparedTx.unsignedTransaction,
        });
    }, [
        accountKey,
        closeSimulationBottomSheet,
        flowType,
        isDeviceConnected,
        navigation,
        preparedTx,
    ]);

    const handleCancelSimulation = useCallback(() => {
        closeSimulationBottomSheet();
    }, [closeSimulationBottomSheet]);

    return {
        handleCancelSimulation,
        handleConfirmSimulation,
        handleSubmit,
        hasFlowFailed,
        isDeviceNotConnectedVisible,
        isPending: !!pendingParam,
        pendingBottomSheetRef,
        pendingModalProps,
        preparedTx,
        simulationBottomSheetRef,
    };
};
