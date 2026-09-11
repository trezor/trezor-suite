import { type ReactNode, createContext, useContext, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';

import {
    type DeviceRef,
    type DeviceRootState,
    createDeviceRef,
    resolveDeviceByRef,
    selectDevices,
} from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';

type FirmwareUpdateSessionValue = {
    /**
     * Which physical device this update is about — an identity (device id, transport, path,
     * model, wallet instance), not a device object. See `DeviceRef`.
     */
    ref: DeviceRef;
};

const FirmwareUpdateSessionContext = createContext<FirmwareUpdateSessionValue | undefined>(
    undefined,
);

type FirmwareUpdateSessionProps = {
    /**
     * The device the caller means: the selected one in the standalone flows, the pinned one in
     * onboarding. Read from wherever the caller reads it, changing as that source changes — the
     * first one it offers is the device this session is about.
     */
    device: TrezorDevice | undefined;
    children: ReactNode;
};

/**
 * Scopes one firmware update to the device it runs on, for as long as the flow is on screen.
 *
 * The update reboots the device several times under new paths, and after a wipe under a new id, so
 * the global selection drifts away from it while the flow is still about it. Fixing which device
 * that is here — once, where the flow opens — makes it this session's device rather than a piece of
 * shared state: nothing has to be dispatched to say which device we mean, nothing has to be reset
 * afterwards, and two flows cannot disagree about it.
 *
 * What is kept is a `DeviceRef`, never a device object: a device object goes stale the moment the
 * device reboots, so the screens resolve it against the device list on every render instead.
 */
export const FirmwareUpdateSession = ({ device, children }: FirmwareUpdateSessionProps) => {
    // The first device offered, kept for as long as this session lives. An update takes its device
    // out of the device list on every reboot and the selection moves on while it is gone, so a
    // session that kept reading its input would end up about a bystander.
    const sessionRef = useRef(device && createDeviceRef(device));

    if (!sessionRef.current && device) {
        sessionRef.current = createDeviceRef(device);
    }

    const session = useMemo(
        () => (sessionRef.current ? { ref: sessionRef.current } : undefined),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [sessionRef.current],
    );

    return (
        <FirmwareUpdateSessionContext.Provider value={session}>
            {children}
        </FirmwareUpdateSessionContext.Provider>
    );
};

/**
 * Which device this firmware flow is about, as an identity.
 *
 * `undefined` outside a session, which is how a screen shared with a flow that has not started one
 * tells the difference. For the device itself, use `useFirmwareSessionDevice`.
 */
export const useFirmwareSessionDeviceRef = (): DeviceRef | undefined =>
    useContext(FirmwareUpdateSessionContext)?.ref;

/**
 * This session's device as the device list has it right now, or `undefined` while nothing in the
 * list can be it — which is most of an update, since the device drops off the list on every reboot.
 *
 * Resolved per render rather than captured, because a device object stops describing the device as
 * soon as it reboots: the path changes every time, the firmware and version change once the install
 * lands, and the id changes if the update wiped it.
 */
export const useFirmwareSessionDevice = (): TrezorDevice | undefined => {
    const ref = useFirmwareSessionDeviceRef();
    const devices = useSelector((state: DeviceRootState) => selectDevices(state));

    return useMemo(() => resolveDeviceByRef({ devices, ref }), [devices, ref]);
};
