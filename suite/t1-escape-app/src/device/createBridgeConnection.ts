import {
    BridgeTransport,
    type Descriptor,
    TRANSPORT,
    TRANSPORT_ERROR,
} from '@trezor/transport-common';
import { type Result, err, ok } from '@trezor/type-utils';

import {
    BRIDGE_TRANSPORT_ID,
    type DeviceSelection,
    getDeviceLostReason,
    isBridgeVersionSupported,
    selectDevice,
} from './bridgeDevice';
import type { DeviceLostReason, TransportCall } from './deviceSession';
import { loadProtobufDefinitions } from './protobufDefinitions';

export type BridgeConnectError =
    /** Trezor Suite is not running, or the browser blocks access to the local network. */
    | { type: 'bridge-unreachable' }
    /** The running Trezor Suite is too old to talk to HID devices. */
    | { type: 'bridge-outdated'; version: string };

export type AcquireError =
    /** Another application holds the device, or the HID backend of the bridge failed to load. */
    { type: 'unable-to-open' } | { type: 'acquire-failed'; code: string };

export type AcquiredDevice = {
    transportCall: TransportCall;
    getLostReason: () => DeviceLostReason | undefined;
    release: () => Promise<void>;
    /** Best-effort release for when the page is being closed. */
    releaseOnUnload: () => void;
};

export type AcquireDeviceParams = {
    descriptor: Descriptor;
    onLost: (reason: DeviceLostReason) => void;
};

export type BridgeConnection = {
    connect: () => Promise<Result<string, BridgeConnectError>>;
    findDevice: () => Promise<Result<DeviceSelection, BridgeConnectError>>;
    acquire: (params: AcquireDeviceParams) => Promise<Result<AcquiredDevice, AcquireError>>;
    dispose: () => void;
};

/**
 * Talks to the bridge inside Trezor Suite desktop over its public REST interface. The bridge
 * is the only way this app reaches the device; there is no WebUSB or WebHID fallback.
 */
export const createBridgeConnection = (): BridgeConnection => {
    loadProtobufDefinitions();

    const transport = new BridgeTransport({ id: BRIDGE_TRANSPORT_ID });
    let reportBridgeLost: (() => void) | undefined;

    const connect: BridgeConnection['connect'] = async () => {
        // Stopping first makes a repeated connect start from a clean transport.
        transport.stop();

        const initialized = await transport.init();
        if (!initialized.success) return err({ type: 'bridge-unreachable' });

        if (!isBridgeVersionSupported(transport.version)) {
            return err({ type: 'bridge-outdated', version: transport.version });
        }

        transport.on(TRANSPORT.ERROR, () => {
            // The listen loop would otherwise keep hammering a bridge that is gone.
            transport.stop();
            reportBridgeLost?.();
        });
        transport.listen();

        return ok(transport.version);
    };

    const findDevice: BridgeConnection['findDevice'] = async () => {
        const enumerated = await transport.enumerate();
        if (!enumerated.success) return err({ type: 'bridge-unreachable' });

        return ok(selectDevice(enumerated.payload));
    };

    const acquire: BridgeConnection['acquire'] = async ({ descriptor, onLost }) => {
        const acquired = await transport.acquire({
            input: { path: descriptor.path, previous: descriptor.session },
        });
        if (!acquired.success) {
            return acquired.error.code === TRANSPORT_ERROR.INTERFACE_UNABLE_TO_OPEN_DEVICE
                ? err({ type: 'unable-to-open' })
                : err({ type: 'acquire-failed', code: acquired.error.code });
        }

        const session = acquired.payload;
        let lostReason: DeviceLostReason | undefined;

        const markLost = (reason: DeviceLostReason) => {
            if (lostReason) return;

            lostReason = reason;
            onLost(reason);
        };

        reportBridgeLost = () => markLost('bridge-unreachable');
        transport.deviceEvents.on(descriptor.path, event => {
            const reason = getDeviceLostReason(event, session);
            if (reason) markLost(reason);
        });

        // Events that fired before the listener was attached are covered by one explicit look
        // at the current state: the device must still be there, held by our session.
        const enumerated = await transport.enumerate();
        const current = enumerated.success
            ? enumerated.payload.find(({ path }) => path === descriptor.path)
            : undefined;
        if (!enumerated.success) {
            markLost('bridge-unreachable');
        } else if (!current) {
            markLost('disconnected');
        } else if (current.session !== session) {
            markLost('session-taken');
        }

        return ok({
            transportCall: ({ name, data }) => transport.call({ session, name, data }),
            getLostReason: () => lostReason,
            release: async () => {
                transport.deviceEvents.removeAllListeners(descriptor.path);
                reportBridgeLost = undefined;
                await transport.release({ path: descriptor.path, session });
            },
            releaseOnUnload: () => transport.releaseSync(session),
        });
    };

    return {
        connect,
        findDevice,
        acquire,
        dispose: () => transport.stop(),
    };
};
