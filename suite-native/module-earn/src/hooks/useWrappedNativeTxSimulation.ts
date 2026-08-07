import { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectIsDeviceConnected } from '@suite-common/device';
import { useBottomSheetModal } from '@suite-native/atoms';

import { type PreparedWrappedNativeTokenAction } from './useWrappedNativeTokenFees';

type UseWrappedNativeTxSimulationParams = {
    amountValue: string | undefined;
    preparedAction: PreparedWrappedNativeTokenAction | null;
    /** Runs once the prepared transaction matches the entered amount, before the sheet opens. */
    onSubmit?: () => void;
    onConfirm: (preparedTx: PreparedWrappedNativeTokenAction) => void;
};

/**
 * Steps between entering a wrap/unwrap amount and handing the transaction over to the review:
 * freezing the prepared transaction, the simulation sheet and the device-connected guard. What
 * happens after the confirmation is injected, because the standalone and the in-deposit flows
 * store and navigate differently.
 */
export const useWrappedNativeTxSimulation = ({
    amountValue,
    preparedAction,
    onSubmit,
    onConfirm,
}: UseWrappedNativeTxSimulationParams) => {
    const [isDeviceNotConnectedVisible, setIsDeviceNotConnectedVisible] = useState(false);
    const [preparedTx, setPreparedTx] = useState<PreparedWrappedNativeTokenAction | null>(null);

    const {
        bottomSheetRef: simulationBottomSheetRef,
        closeModal: closeSimulationBottomSheet,
        openModal: openSimulationBottomSheet,
    } = useBottomSheetModal();

    const isDeviceConnected = useSelector(selectIsDeviceConnected);

    const handleSubmit = useCallback(() => {
        if (preparedAction?.amount !== amountValue) {
            return;
        }

        onSubmit?.();
        setPreparedTx(preparedAction);
        requestAnimationFrame(openSimulationBottomSheet);
    }, [amountValue, onSubmit, openSimulationBottomSheet, preparedAction]);

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
        onConfirm(preparedTx);
    }, [closeSimulationBottomSheet, isDeviceConnected, onConfirm, preparedTx]);

    const handleCancelSimulation = useCallback(() => {
        closeSimulationBottomSheet();
    }, [closeSimulationBottomSheet]);

    return {
        handleCancelSimulation,
        handleConfirmSimulation,
        handleSubmit,
        isDeviceNotConnectedVisible,
        preparedTx,
        simulationBottomSheetRef,
    };
};
