import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { selectSelectedDevice } from '@suite-common/device';
import { useSelector } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';

import { addDeviceIdToSeenDisconnectNotification } from '../../actions/suite/suiteActions';
export const useNotificationForDisconnectedDevice = () => {
    const dispatch = useDispatch();

    const selectedDevice = useSelector(selectSelectedDevice);
    const seenDisconnectNotificationForDeviceIds = useSelector(
        state => state.suite.seenDisconnectNotificationForDeviceIds,
    );
    const recentlyDisconnectedDevice = useSelector(state => state.suite.recentlyDisconnectedDevice);
    const hasSeenDisconnectTooltip = useSelector(state => state.flags.hasSeenDisconnectTooltip);

    useEffect(() => {
        const deviceId = selectedDevice?.id;

        if (deviceId) {
            const isNotificationSeenOnThisDevice =
                seenDisconnectNotificationForDeviceIds?.includes(deviceId) ?? false;

            const isNotificationVisible =
                recentlyDisconnectedDevice === deviceId &&
                !isNotificationSeenOnThisDevice &&
                hasSeenDisconnectTooltip;

            if (isNotificationVisible) {
                dispatch(notificationsActions.addToast({ type: 'auto-eject-settings' }));
                dispatch(addDeviceIdToSeenDisconnectNotification(deviceId));
            }
        }
    }, [
        dispatch,
        hasSeenDisconnectTooltip,
        recentlyDisconnectedDevice,
        seenDisconnectNotificationForDeviceIds,
        selectedDevice?.id,
    ]);
};
