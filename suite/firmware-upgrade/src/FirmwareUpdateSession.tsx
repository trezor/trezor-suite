import { type ReactNode, createContext, useContext, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { type DeviceRootState, resolveConnectedDevice, selectDevices } from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';

type FirmwareUpdateSessionValue = {
    /**
     * The device this update is about, as it was when the flow opened. What the screens name,
     * version and describe: after the first reboot the device reports nothing of the firmware the
     * user is upgrading from.
     */
    device: TrezorDevice;
};

const FirmwareUpdateSessionContext = createContext<FirmwareUpdateSessionValue | undefined>(
    undefined,
);

type FirmwareUpdateSessionProps = {
    /** The device the caller means: the selected one in the standalone flows, the pinned one in onboarding. */
    device: TrezorDevice;
    children: ReactNode;
};

/**
 * Scopes one firmware update to the device it runs on, for as long as the flow is on screen.
 *
 * The update reboots the device several times under new paths, and after a wipe under a new id, so
 * the global selection drifts away from it while the flow is still about it. Capturing it here —
 * once, where the flow opens — makes it this session's device rather than a piece of shared state:
 * nothing has to be dispatched to say which device we mean, nothing has to be reset afterwards,
 * and two flows cannot disagree about it.
 */
export const FirmwareUpdateSession = ({ device, children }: FirmwareUpdateSessionProps) => {
    // Captured once. Later renders may bring a different selection, and this session is not about
    // whatever that is.
    const [session] = useState<FirmwareUpdateSessionValue>(() => ({ device }));

    return (
        <FirmwareUpdateSessionContext.Provider value={session}>
            {children}
        </FirmwareUpdateSessionContext.Provider>
    );
};

/**
 * The device this firmware flow is about, as it was when the flow opened.
 *
 * `undefined` outside a session, which is how a screen shared with a flow that has not started one
 * tells the difference.
 */
export const useFirmwareSessionDevice = (): TrezorDevice | undefined =>
    useContext(FirmwareUpdateSessionContext)?.device;

/**
 * This session's device as the device list has it right now, or `undefined` while it is not
 * reachable — which is most of an update, since the device drops off the list on every reboot.
 *
 * For anything that has to know where the device *is* (whether it is back, and in which mode),
 * rather than what it was.
 */
export const useFirmwareSessionLiveDevice = (): TrezorDevice | undefined => {
    const sessionDevice = useFirmwareSessionDevice();
    const devices = useSelector((state: DeviceRootState) => selectDevices(state));

    return useMemo(
        () =>
            sessionDevice &&
            resolveConnectedDevice(devices, {
                apiType: sessionDevice.descriptor.apiType,
                path: sessionDevice.path,
            }),
        [devices, sessionDevice],
    );
};
