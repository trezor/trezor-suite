import { useCallback, useEffect, useMemo, useState } from 'react';

import { useIsFocused, useNavigation } from '@react-navigation/native';

import {
    type WrappedNativeFlowType,
    type YieldPendingTransactionState,
    useWrappedNativePendingTx,
} from '@suite-common/wallet-core';
import { type Account, type AccountKey } from '@suite-common/wallet-types';
import {
    type StackNavigationProps,
    type WrappedNativeTokenPendingTxParams,
    type WrappedNativeTokenStackParamList,
    type WrappedNativeTokenStackRoutes,
} from '@suite-native/navigation';

import { type PreparedWrappedNativeTokenAction } from './useWrappedNativeTokenFees';
import { useWrappedNativeTxSimulation } from './useWrappedNativeTxSimulation';
import { useYieldPendingTransaction } from './useYieldPendingTransaction';
import { wrappedNativeTokenFlowRoutes } from '../utils/wrappedNativeTokenFlowRoutes';

type UseStandaloneWrappedNativeFlowParams = {
    account: Account | null;
    accountKey: AccountKey;
    amountValue: string | undefined;
    flowType: WrappedNativeFlowType;
    isDisabled: boolean;
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
    isDisabled,
    pendingParam,
    preparedAction,
}: UseStandaloneWrappedNativeFlowParams) => {
    const navigation = useNavigation<NavigationProps>();
    const isFocused = useIsFocused();

    const [hasFlowFailed, setHasFlowFailed] = useState(false);

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

    const handleFlowRetry = useCallback(() => {
        setHasFlowFailed(false);
    }, []);

    const handleSimulationConfirmed = useCallback(
        (preparedTx: PreparedWrappedNativeTokenAction) => {
            navigation.navigate(wrappedNativeTokenFlowRoutes[flowType].review, {
                accountKey,
                amount: preparedTx.amount,
                unsignedTransaction: preparedTx.unsignedTransaction,
            });
        },
        [accountKey, flowType, navigation],
    );

    const simulation = useWrappedNativeTxSimulation({
        amountValue,
        isDisabled,
        onConfirm: handleSimulationConfirmed,
        onSubmit: handleFlowRetry,
        preparedAction,
    });

    return {
        handleCancelSimulation: simulation.handleCancelSimulation,
        handleConfirmSimulation: simulation.handleConfirmSimulation,
        handleSubmit: simulation.handleSubmit,
        hasFlowFailed,
        isDeviceNotConnectedVisible: simulation.isDeviceNotConnectedVisible,
        isFirmwareOutdatedVisible: simulation.isFirmwareOutdatedVisible,
        isPending: !!pendingParam,
        pendingBottomSheetRef,
        pendingModalProps,
        preparedTx: simulation.preparedTx,
        simulationBottomSheetRef: simulation.simulationBottomSheetRef,
    };
};
