import { type TrezorDevice } from '@suite-common/suite-types';
import { type Device } from '@trezor/connect';
import { exhaustive } from '@trezor/type-utils';

import { type DeviceRef, DeviceRefMatch, createDeviceRef, getDeviceRefMatch } from './deviceRef';

/**
 * A firmware update makes the device disappear and come back several times, and there is no
 * identifier that provably survives every one of those cycles (see `DeviceRef`). So we
 * follow the device through the update with an explicit state machine instead of assuming the
 * globally selected device is still the right one.
 *
 * The machine is pure: it consumes connect device events and produces the ref we should be
 * addressing. Acquiring and selecting the adopted device is a side effect left to the caller,
 * which must not run it while the update is still in flight — `@trezor/connect` acquires the
 * reconnected device itself during `firmwareUpdate`, and a competing acquire would break it.
 */
export const DeviceTrackingPhase = {
    /** Not tracking anything. */
    Idle: 'idle',
    /** `currentRef` points at a device that is connected right now. */
    Tracking: 'tracking',
    /** The tracked device went away; we expect it to come back after rebooting. */
    AwaitingReconnect: 'awaiting-reconnect',
} as const;

export type DeviceTrackingPhase = (typeof DeviceTrackingPhase)[keyof typeof DeviceTrackingPhase];

export type DeviceTrackingState = {
    phase: DeviceTrackingPhase;
    /**
     * The device as it was when the update started. Never rewritten, so the passphrase wallet the
     * user started from survives a wipe that changes everything else about the device.
     */
    initialRef: DeviceRef | undefined;
    /** Where we believe the device is reachable now. Rewritten on every adoption. */
    currentRef: DeviceRef | undefined;
};

export const deviceTrackingInitialState: DeviceTrackingState = {
    phase: DeviceTrackingPhase.Idle,
    initialRef: undefined,
    currentRef: undefined,
};

export type DeviceTrackingEvent =
    | { type: 'arm'; device: Device | TrezorDevice }
    | {
          type: 'device-connect';
          device: Device;
          /**
           * Whether this device is the only connected one the ref could point at. Derived from the
           * device list by the caller, because the machine itself only sees one device at a time.
           * See `getIsOnlyDeviceRefCandidate`.
           */
          isOnlyCandidate: boolean;
      }
    | { type: 'device-disconnect'; device: Device };

const trackDevice = (state: DeviceTrackingState, device: Device): DeviceTrackingState => ({
    ...state,
    phase: DeviceTrackingPhase.Tracking,
    currentRef: {
        ...createDeviceRef(device),
        // A reconnected device is a fresh connection with no instance of its own yet; keep
        // pointing at the passphrase wallet the update was started from.
        instance: state.initialRef?.instance,
    },
});

const handleDeviceConnect = (
    state: DeviceTrackingState,
    { device, isOnlyCandidate }: { device: Device; isOnlyCandidate: boolean },
): DeviceTrackingState => {
    if (!state.currentRef) {
        return state;
    }

    const match = getDeviceRefMatch(device, state.currentRef);

    // Already connected: only refresh the ref so `path` stays current.
    if (state.phase === DeviceTrackingPhase.Tracking) {
        return match >= DeviceRefMatch.Path ? trackDevice(state, device) : state;
    }

    if (match >= DeviceRefMatch.Transport) {
        return trackDevice(state, device);
    }

    // A device that reconnects after a firmware update reports a brand new `path`, so a path match
    // here would be a coincidence rather than evidence. Only the model heuristic is left, and it is
    // trustworthy only while nothing else could be mistaken for our device.
    if (match === DeviceRefMatch.Model && isOnlyCandidate) {
        return trackDevice(state, device);
    }

    return state;
};

export const deviceTrackingReducer = (
    state: DeviceTrackingState,
    event: DeviceTrackingEvent,
): DeviceTrackingState => {
    switch (event.type) {
        case 'arm': {
            const ref = createDeviceRef(event.device);

            return {
                phase: DeviceTrackingPhase.Tracking,
                initialRef: ref,
                currentRef: ref,
            };
        }

        case 'device-connect':
            return handleDeviceConnect(state, event);

        case 'device-disconnect': {
            if (state.phase !== DeviceTrackingPhase.Tracking || !state.currentRef) {
                return state;
            }

            // The disconnect event carries the same `path` the device connected with, so a path
            // match is conclusive here — unlike on connect.
            if (getDeviceRefMatch(event.device, state.currentRef) < DeviceRefMatch.Path) {
                return state;
            }

            return { ...state, phase: DeviceTrackingPhase.AwaitingReconnect };
        }

        default:
            return exhaustive(event);
    }
};
