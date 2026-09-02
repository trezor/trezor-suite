import { useEffect, useState } from 'react';

import { selectIsConnectionModalOpen, setConnectionModal, setConnectionMode } from '@suite/device';
import { gotoThunk } from '@suite/router';
import { selectSelectedDevice } from '@suite-common/device';
import { useDispatch } from '@suite-common/redux-utils';

import { useSelector } from 'src/hooks/suite';

export const useFirmwareUpgradeModal = () => {
    const dispatch = useDispatch();
    const device = useSelector(selectSelectedDevice);
    const isConnectionModalOpen = useSelector(selectIsConnectionModalOpen);
    const [isFirmwareModalOpen, setIsFirmwareModalOpen] = useState(false);
    const [isAwaitingConnectionForFwUpdate, setIsAwaitingConnectionForFwUpdate] = useState(false);

    useEffect(() => {
        if (isAwaitingConnectionForFwUpdate && !isConnectionModalOpen) {
            setIsAwaitingConnectionForFwUpdate(false);
            if (device?.connected) {
                setIsFirmwareModalOpen(false);
                dispatch(gotoThunk({ routeName: 'firmware-index', params: { cancelable: true } }));
            }
        }
    }, [isAwaitingConnectionForFwUpdate, isConnectionModalOpen, device?.connected, dispatch]);

    const openFirmwareModal = () => setIsFirmwareModalOpen(true);

    const closeFirmwareModal = () => {
        setIsFirmwareModalOpen(false);
        setIsAwaitingConnectionForFwUpdate(false);
    };

    const updateFirmware = () => {
        if (!device?.connected) {
            if (device?.descriptor?.apiType === 'bluetooth') {
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
