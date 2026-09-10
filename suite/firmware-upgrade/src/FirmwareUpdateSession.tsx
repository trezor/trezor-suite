import { type ReactNode, createContext, useContext, useMemo, useRef } from 'react';
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
    /**
     * The device the caller means: the selected one in the standalone flows, the pinned one in
     * onboarding. Read from wherever the caller reads it, changing as that source changes — the
     * first one it offers is the device this session keeps.
     */
    device: TrezorDevice | undefined;
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
/**
 * The first device offered, kept for as long as the caller lives.
 *
 * A firmware update takes its device out of the device list on every reboot, and the selection
 * moves on while it is gone — so anything that reads the device from a live source and needs to
 * stay about the same physical device has to stop reading at some point. This is that point.
 */
export const useLatchedDevice = (device: TrezorDevice | undefined): TrezorDevice | undefined => {
    const latched = useRef(device);

    if (!latched.current && device) {
        latched.current = device;
    }

    return latched.current;
};

export const FirmwareUpdateSession = ({ device, children }: FirmwareUpdateSessionProps) => {
    const latchedDevice = useLatchedDevice(device);

    const session = useMemo(
        () => (latchedDevice ? { device: latchedDevice } : undefined),
        [latchedDevice],
    );

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
