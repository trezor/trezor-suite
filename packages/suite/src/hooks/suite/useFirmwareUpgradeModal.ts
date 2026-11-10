import { useEffect, useState } from 'react';

import { selectIsConnectionModalOpen, setConnectionModal, setConnectionMode } from '@suite/device';
import { gotoThunk } from '@suite/router';
import { selectIsDeviceApiTypeBluetooth, selectIsDeviceConnected } from '@suite-common/device';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { useSelector } from '#src/hooks/suite';

export const useFirmwareUpgradeModal = () => {
    const { dispatch } = useServices(injectDispatch);
    const isDeviceConnected = useSelector(selectIsDeviceConnected);
    const isDeviceApiTypeBluetooth = useSelector(selectIsDeviceApiTypeBluetooth);
    const isConnectionModalOpen = useSelector(selectIsConnectionModalOpen);
    const [isFirmwareModalOpen, setIsFirmwareModalOpen] = useState(false);
    const [isAwaitingConnectionForFwUpdate, setIsAwaitingConnectionForFwUpdate] = useState(false);

    useEffect(() => {
        if (isAwaitingConnectionForFwUpdate && !isConnectionModalOpen) {
            setIsAwaitingConnectionForFwUpdate(false);
            if (isDeviceConnected) {
                setIsFirmwareModalOpen(false);
                dispatch(gotoThunk({ routeName: 'firmware-index', params: { cancelable: true } }));
            }
        }
    }, [isAwaitingConnectionForFwUpdate, isConnectionModalOpen, isDeviceConnected, dispatch]);

    const openFirmwareModal = () => setIsFirmwareModalOpen(true);

    const closeFirmwareModal = () => {
        setIsFirmwareModalOpen(false);
        setIsAwaitingConnectionForFwUpdate(false);
    };

    const updateFirmware = () => {
        if (!isDeviceConnected) {
            if (isDeviceApiTypeBluetooth) {
                dispatch(setConnectionMode('bluetooth'));
            }
            setIsAwaitingConnectionForFwUpdate(true);
            dispatch(setConnectionModal(true));

            return;
        }

        setIsFirmwareModalOpen(false);
        dispatch(gotoThunk({ routeName: 'firmware-index', params: { cancelable: true } }));
    };

    return { isFirmwareModalOpen, openFirmwareModal, closeFirmwareModal, updateFirmware };
};
