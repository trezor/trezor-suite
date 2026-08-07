import { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectIsDeviceConnected } from '@suite-common/device';
import { selectIsWrappedNativeFlowSupported } from '@suite-common/wallet-core';
import { useBottomSheetModal } from '@suite-native/atoms';

import { type PreparedWrappedNativeTokenAction } from './useWrappedNativeTokenFees';

type UseWrappedNativeTxSimulationParams = {
    amountValue: string | undefined;
    isDisabled: boolean;
    preparedAction: PreparedWrappedNativeTokenAction | null;
    /** Runs once the prepared transaction matches the entered amount, before the sheet opens. */
    onSubmit?: () => void;
    onConfirm: (preparedTx: PreparedWrappedNativeTokenAction) => void;
};

/**
 * Steps between entering a wrap/unwrap amount and handing the transaction over to the review:
 * freezing the prepared transaction, the simulation sheet and the device guards. What
 * happens after the confirmation is injected, because the standalone and the in-deposit flows
 * store and navigate differently.
 */
export const useWrappedNativeTxSimulation = ({
    amountValue,
    isDisabled,
    preparedAction,
    onSubmit,
    onConfirm,
}: UseWrappedNativeTxSimulationParams) => {
    const [isDeviceNotConnectedVisible, setIsDeviceNotConnectedVisible] = useState(false);
    const [isFirmwareOutdatedVisible, setIsFirmwareOutdatedVisible] = useState(false);
    const [preparedTx, setPreparedTx] = useState<PreparedWrappedNativeTokenAction | null>(null);

    const {
        bottomSheetRef: simulationBottomSheetRef,
        closeModal: closeSimulationBottomSheet,
        openModal: openSimulationBottomSheet,
    } = useBottomSheetModal();

    const isDeviceConnected = useSelector(selectIsDeviceConnected);
    const isFirmwareSupported = useSelector(selectIsWrappedNativeFlowSupported);

    const handleSubmit = useCallback(() => {
        // The remote config can flip while the simulation sheet is open, so both paths into the
        // device review re-check it.
        if (isDisabled || preparedAction?.amount !== amountValue) {
            return;
        }

        onSubmit?.();
        setPreparedTx(preparedAction);
        requestAnimationFrame(openSimulationBottomSheet);
    }, [amountValue, isDisabled, onSubmit, openSimulationBottomSheet, preparedAction]);

    const handleConfirmSimulation = useCallback(() => {
        closeSimulationBottomSheet();

        if (isDisabled || !preparedTx) {
            return;
        }

        const isFirmwareOutdated = isDeviceConnected && !isFirmwareSupported;

        setIsDeviceNotConnectedVisible(!isDeviceConnected);
        setIsFirmwareOutdatedVisible(isFirmwareOutdated);

        if (!isDeviceConnected || isFirmwareOutdated) {
            return;
        }

        onConfirm(preparedTx);
    }, [
        closeSimulationBottomSheet,
        isDeviceConnected,
        isDisabled,
        isFirmwareSupported,
        onConfirm,
        preparedTx,
    ]);

    const handleCancelSimulation = useCallback(() => {
        closeSimulationBottomSheet();
    }, [closeSimulationBottomSheet]);

    return {
        handleCancelSimulation,
        handleConfirmSimulation,
        handleSubmit,
        isDeviceNotConnectedVisible,
        isFirmwareOutdatedVisible,
        preparedTx,
        simulationBottomSheetRef,
    };
};
