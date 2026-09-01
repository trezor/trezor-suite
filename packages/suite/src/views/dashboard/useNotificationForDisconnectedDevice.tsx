import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { selectHasSeenDisconnectTooltip } from '@suite/flags';
import { selectSelectedDevice } from '@suite-common/device';
import { notificationsActions } from '@suite-common/toast-notifications';

import { useSelector } from 'src/hooks/suite';
import {
    selectRecentlyDisconnectedDevice,
    selectSeenDisconnectNotificationForDeviceIds,
} from 'src/selectors/suite/suiteSelectors';

import { addDeviceIdToSeenDisconnectNotification } from '../../actions/suite/suiteActions';

export const useNotificationForDisconnectedDevice = () => {
    const dispatch = useDispatch();

    const selectedDevice = useSelector(selectSelectedDevice);
    const seenDisconnectNotificationForDeviceIds = useSelector(
        selectSeenDisconnectNotificationForDeviceIds,
    );
    const recentlyDisconnectedDevice = useSelector(selectRecentlyDisconnectedDevice);
    const hasSeenDisconnectTooltip = useSelector(selectHasSeenDisconnectTooltip);

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
