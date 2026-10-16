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
import { diagnosticLog } from '../app/diagnosticLog';

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
        if (!initialized.success) {
            diagnosticLog.error('bridge', 'init failed', {
                code: initialized.error.code,
                message: initialized.error.message,
            });

            return err({ type: 'bridge-unreachable' });
        }

        diagnosticLog.info('bridge', 'connected', { version: transport.version });
        if (!isBridgeVersionSupported(transport.version)) {
            diagnosticLog.error('bridge', 'version too old for HID devices', {
                version: transport.version,
            });

            return err({ type: 'bridge-outdated', version: transport.version });
        }

        transport.on(TRANSPORT.ERROR, () => {
            diagnosticLog.error('bridge', 'transport error, bridge gone');
            // The listen loop would otherwise keep hammering a bridge that is gone.
            transport.stop();
            reportBridgeLost?.();
        });
        transport.listen();

        return ok(transport.version);
    };

    const findDevice: BridgeConnection['findDevice'] = async () => {
        const enumerated = await transport.enumerate();
        if (!enumerated.success) {
            diagnosticLog.error('bridge', 'enumerate failed', { code: enumerated.error.code });

            return err({ type: 'bridge-unreachable' });
        }

        const selection = selectDevice(enumerated.payload);
        // Public paths and session numbers are counters of the bridge, nothing identifying.
        diagnosticLog.info('bridge', 'enumerated', {
            devices: enumerated.payload.map(({ path, type, session, vendor, product }) => ({
                path,
                type,
                session,
                vendor,
                product,
            })),
            selection: selection.type,
        });

        return ok(selection);
    };

    const acquire: BridgeConnection['acquire'] = async ({ descriptor, onLost }) => {
        diagnosticLog.info('bridge', 'acquire', {
            path: descriptor.path,
            previous: descriptor.session,
        });
        const acquired = await transport.acquire({
            input: { path: descriptor.path, previous: descriptor.session },
        });
        if (!acquired.success) {
            diagnosticLog.error('bridge', 'acquire failed', {
                code: acquired.error.code,
                message: acquired.error.message,
            });

            return acquired.error.code === TRANSPORT_ERROR.INTERFACE_UNABLE_TO_OPEN_DEVICE
                ? err({ type: 'unable-to-open' })
                : err({ type: 'acquire-failed', code: acquired.error.code });
        }

        const session = acquired.payload;
        diagnosticLog.info('bridge', 'acquired', { session });
        let lostReason: DeviceLostReason | undefined;

        const markLost = (reason: DeviceLostReason) => {
            if (lostReason) return;

            lostReason = reason;
            diagnosticLog.error('bridge', 'device lost', { reason });
            onLost(reason);
        };

        reportBridgeLost = () => markLost('bridge-unreachable');
        transport.deviceEvents.on(descriptor.path, event => {
            diagnosticLog.info('bridge', 'device event', {
                type: event.type,
                ...('descriptor' in event ? { session: event.descriptor.session } : {}),
            });
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
                const released = await transport.release({ path: descriptor.path, session });
                diagnosticLog.info('bridge', 'released', {
                    session,
                    ...(released.success ? {} : { error: released.error.code }),
                });
            },
            releaseOnUnload: () => {
                diagnosticLog.info('bridge', 'release on page unload', { session });
                transport.releaseSync(session);
            },
        });
    };

    return {
        connect,
        findDevice,
        acquire,
        dispose: () => transport.stop(),
    };
};
