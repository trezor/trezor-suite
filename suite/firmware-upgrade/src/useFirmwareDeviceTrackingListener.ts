import { useEffect } from 'react';

import { useServices } from '@suite-common/dependency-injection';
import { firmwareActions } from '@suite-common/firmware';
import { useDispatch } from '@suite-common/redux-utils';
import { selectDeviceReceiverDep } from '@suite-common/suite-types';

import { handleTrackedDeviceConnectThunk } from './handleTrackedDeviceConnectThunk';

/**
 * Follows the device being updated across the disconnects and reconnects a firmware update forces,
 * keeping the firmware device ref pointed at it.
 *
 * Mount this on the screen the update runs on, and read the device itself with
 * `selectFirmwareDevice` — subscribing and selecting are separate concerns, and most of the flow
 * only needs the latter.
 *
 * Arming the ref and putting the selection back on the device afterwards both happen in
 * `useFirmwareDesktopUpdate`, around the update call itself, because both have a real moment to
 * happen at and neither needs to be discovered by watching state.
 *
 * Unmounting deliberately does not stop tracking. An update can outlive this component (the user
 * navigates away mid-install), and the update call still has to be able to resolve the device it
 * updated when it returns. `firmwareActions.resetReducer`, which every exit from the flow already
 * dispatches, is what clears tracking.
 */
export const useFirmwareDeviceTrackingListener = () => {
    const dispatch = useDispatch();
    const { deviceReceiver } = useServices(selectDeviceReceiverDep);

    useEffect(() => {
        // Subscribed for the whole lifetime of the flow rather than only while armed: gating this
        // on the phase would open a window right after arming in which a disconnect is missed, and
        // the state machine ignores events while idle anyway.
        const unsubscribeFromConnect = deviceReceiver.onDeviceConnected(device => {
            dispatch(handleTrackedDeviceConnectThunk(device));
        });

        const unsubscribeFromDisconnect = deviceReceiver.onDeviceDisconnected(device => {
            dispatch(firmwareActions.trackedDeviceDisconnected(device));
        });

        return () => {
            unsubscribeFromConnect();
            unsubscribeFromDisconnect();
        };
    }, [dispatch, deviceReceiver]);
};
