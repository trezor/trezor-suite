import { useEffect } from 'react';

import { useServices } from '@suite-common/dependency-injection';
import { useDispatch } from '@suite-common/redux-utils';
import { selectDeviceReceiverDep } from '@suite-common/suite-types';

import * as onboardingActions from 'src/actions/onboarding/onboardingActions';

/**
 * Follows the onboarded device across the disconnects and reconnects onboarding forces — the
 * firmware update reboots it, and initialising it wipes the `device_id` it connected with — so the
 * onboarded device ref keeps pointing at it.
 *
 * Mount this once for the whole flow and read the device itself with `selectOnboardedDevice`;
 * subscribing and selecting are separate concerns, and every step only needs the latter.
 *
 * Arming happens where onboarding begins, in the CTA that navigates here, because that is the last
 * moment the selection is still the device the user meant. Arming the firmware ref is left to
 * `firmwareUpdateThunk`, from the device the firmware step hands it — which is this one, so both
 * refs follow the same device through the same reboots.
 */
export const useOnboardedDeviceTracking = () => {
    const dispatch = useDispatch();
    const { deviceReceiver } = useServices(selectDeviceReceiverDep);

    useEffect(() => {
        const unsubscribeFromConnect = deviceReceiver.onDeviceConnected(device => {
            dispatch(onboardingActions.handleOnboardedDeviceConnectThunk(device));
        });

        const unsubscribeFromDisconnect = deviceReceiver.onDeviceDisconnected(device => {
            dispatch(onboardingActions.onboardedDeviceDisconnected(device));
        });

        return () => {
            unsubscribeFromConnect();
            unsubscribeFromDisconnect();
        };
    }, [dispatch, deviceReceiver]);
};
