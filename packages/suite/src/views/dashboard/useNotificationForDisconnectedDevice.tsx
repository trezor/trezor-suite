import { useEffect } from 'react';

import { notificationsActions } from '@suite-common/toast-notifications';
import { selectSelectedDevice } from '@suite-common/wallet-core';

import { addDeviceIdToSeenDisconnectNotification } from '../../actions/suite/suiteActions';
import { useDispatch, useSelector } from '../../hooks/suite';

export const useNotificationForDisconnectedDevice = () => {
    const dispatch = useDispatch();

    const seenDisconnectNotificationForDeviceIds = useSelector(
        state => state.suite.seenDisconnectNotificationForDeviceIds,
    );
    const hasSeenDisconnectTooltip = useSelector(
        state => state.suite.flags.hasSeenDisconnectTooltip,
    );
    const recentlyDisconnectedDevice = useSelector(state => state.suite.recentlyDisconnectedDevice);
    const selectedDevice = useSelector(selectSelectedDevice);

    useEffect(() => {
        const deviceId = selectedDevice?.id;
        const shouldShowNotification =
            deviceId && seenDisconnectNotificationForDeviceIds
                ? seenDisconnectNotificationForDeviceIds.every(id => id !== selectedDevice?.id)
                : false;

        const isNotificationVisible =
            deviceId &&
            recentlyDisconnectedDevice === deviceId &&
            shouldShowNotification &&
            hasSeenDisconnectTooltip;

        if (isNotificationVisible) {
            dispatch(notificationsActions.addToast({ type: 'auto-eject-settings' }));

            dispatch(addDeviceIdToSeenDisconnectNotification(deviceId));
        }
    }, [
        dispatch,
        hasSeenDisconnectTooltip,
        recentlyDisconnectedDevice,
        seenDisconnectNotificationForDeviceIds,
        selectedDevice?.id,
        selectedDevice?.state,
    ]);
};
