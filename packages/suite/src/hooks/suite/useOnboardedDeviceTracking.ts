import { useEffect } from 'react';

import { useServices } from '@suite-common/dependency-injection';
import { selectSelectedDevice } from '@suite-common/device';
import { useDispatch } from '@suite-common/redux-utils';
import { selectDeviceReceiverDep } from '@suite-common/suite-types';

import * as onboardingActions from 'src/actions/onboarding/onboardingActions';
import { useSelector } from 'src/hooks/suite/useSelector';
import { selectIsOnboardingInProgress } from 'src/selectors/onboarding/onboardingSelectors';

/**
 * Follows the onboarded device across the disconnects and reconnects onboarding forces — the
 * firmware update reboots it, and initialising it wipes the `device_id` it connected with — so the
 * onboarded device ref keeps pointing at it.
 *
 * Mount this once for the whole flow and read the device itself with `selectOnboardedDevice`;
 * subscribing and selecting are separate concerns, and every step only needs the latter.
 *
 * Arming happens in the CTA that starts onboarding wherever there is one, because that is the last
 * moment the selection is certainly the device the user meant. Not every way in has a CTA though —
 * a first run navigates here on its own, and so does a reload or a deep link — so this arms too,
 * for whatever arrives unpinned. Arming the firmware ref is left to `firmwareUpdateThunk`, from the
 * device the firmware step hands it, which is this one; both refs then follow the same device.
 */
export const useOnboardedDeviceTracking = () => {
    const dispatch = useDispatch();
    const { deviceReceiver } = useServices(selectDeviceReceiverDep);
    const selectedDevice = useSelector(selectSelectedDevice);
    const isOnboardingInProgress = useSelector(selectIsOnboardingInProgress);

    useEffect(() => {
        // Only for a run that arrived without a CTA to pin it. Re-arming an onboarding that is
        // already pinned would discard a ref that may be following the device through a reboot.
        if (isOnboardingInProgress) {
            return;
        }

        // Devices arrive asynchronously, so on a fresh load there is nothing to pin yet; this
        // settles as soon as one is connected. A disconnected device is a stale list entry, and
        // pinning to it would give onboarding a ref that can never resolve.
        if (!selectedDevice?.connected) {
            return;
        }

        dispatch(onboardingActions.armOnboardedDeviceTracking(selectedDevice));
    }, [dispatch, isOnboardingInProgress, selectedDevice]);

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
