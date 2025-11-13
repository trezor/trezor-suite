// original file https://github.com/trezor/connect/blob/develop/src/js/device/DeviceList.js

import { SessionsBackground, SessionsClient, TRANSPORT, Transport } from '@trezor/transport';
import { Descriptor } from '@trezor/transport/src/types';
import { TypedEmitter, createDeferred, getSynchronize, resolveAfter } from '@trezor/utils';

import { ERRORS } from '../constants';
import { DEVICE, DecodedTrezorPushNotification, TransportError, TransportInfo } from '../events';
import { Device } from './Device';
import { ConnectSettings, DeviceUniquePath, StaticSessionId, asDeviceUniquePath } from '../types';
import { createTransportList } from './TransportList';
import { initLog } from '../utils/debug';

const createAuthPenaltyManager = (priority: number) => {
    const penalizedDevices: { [deviceID: string]: number } = {};

    const get = () =>
        100 * priority +
        Object.keys(penalizedDevices).reduce(
            (penalty, key) => Math.max(penalty, penalizedDevices[key]),
            0,
        );

    const add = (device: Device) => {
        if (!device.isInitialized() || device.isBootloader() || !device.features.device_id) return;
        const deviceID = device.features.device_id;
        const penalty = penalizedDevices[deviceID] ? penalizedDevices[deviceID] + 500 : 2000;
        penalizedDevices[deviceID] = Math.min(penalty, 5000);
    };

    const remove = (device: Device) => {
        if (!device.isInitialized() || device.isBootloader() || !device.features.device_id) return;
        const deviceID = device.features.device_id;
        delete penalizedDevices[deviceID];
    };

    const clear = () => Object.keys(penalizedDevices).forEach(key => delete penalizedDevices[key]);

    return { get, add, remove, clear };
};

const getTransportInfo = (transport: Transport): TransportInfo => ({
    // todo: I don't like this, imho fallback shouldn't be needed here.
    apiType: transport?.apiType ?? 'usb',
    type: transport?.name ?? 'UnifiedTransport',
    version: transport?.version ?? '',
    outdated: transport?.isOutdated ?? false,
});

interface DeviceListEvents {
    [TRANSPORT.START]: TransportInfo;
    [TRANSPORT.ERROR]: TransportError;
    [DEVICE.CONNECT]: Device;
    [DEVICE.CONNECT_UNACQUIRED]: Device;
    [DEVICE.TREZOR_PUSH_NOTIFICATION]: DecodedTrezorPushNotification & { device: Device };
    [DEVICE.DISCONNECT]: Device;
    [DEVICE.CHANGED]: Device;
}

export interface IDeviceList {
    isConnected(): this is DeviceList;
    pendingConnection(): Promise<void> | undefined;
    addAuthPenalty: DeviceList['addAuthPenalty'];
    removeAuthPenalty: DeviceList['removeAuthPenalty'];
    on: DeviceList['on'];
    once: DeviceList['once'];
    init: DeviceList['init'];
    dispose: DeviceList['dispose'];
}

export const assertDeviceListConnected: (
    deviceList: IDeviceList,
) => asserts deviceList is DeviceList = deviceList => {
    if (!deviceList.isConnected()) {
        throw ERRORS.TypedError('Transport_Missing');
    }
};

type ConstructorParams = Pick<ConnectSettings, 'priority' | 'debug' | 'manifest'> & {
    messages: Record<string, any>;
};
type InitParams = Pick<
    ConnectSettings,
    'apiTypes' | 'pendingTransportEvent' | 'transportReconnect'
> & {
    // For testing only: inject transports directly instead of creating them
    _transports?: Transport[];
};

export class DeviceList extends TypedEmitter<DeviceListEvents> implements IDeviceList {
    // Single unified transport managing all API types
    private transport?: Transport;
    private transportReconnect = false;

    private devices: Device[] = [];
    private deviceCounter = Date.now();

    private readonly handshakeLock;
    private readonly authPenaltyManager;

    private updateTransports;

    isConnected(): this is DeviceList {
        return !!this.transport;
    }

    pendingConnection() {
        // Transport initialization is synchronous now
        return undefined;
    }

    getActiveTransports() {
        return this.transport ? [getTransportInfo(this.transport)] : [];
    }

    constructor({ messages, priority, debug, manifest }: ConstructorParams) {
        super();

        const transportLogger = initLog('@trezor/transport', debug);

        this.handshakeLock = getSynchronize();
        this.authPenaltyManager = createAuthPenaltyManager(priority);

        const sessionsBackground = new SessionsBackground();
        const sessionsClient = new SessionsClient(sessionsBackground);

        this.updateTransports = createTransportList({
            messages,
            logger: transportLogger,
            id: manifest?.appName || manifest?.appUrl || 'unknown app',
            sessionsClient,
        });
    }

    private async onDeviceConnected(descriptor: Descriptor, transport: Transport) {
        const id = (this.deviceCounter++).toString(16).slice(-8);
        const device = new Device({ id: asDeviceUniquePath(id), transport, descriptor });

        const penalty = this.authPenaltyManager.get();
        const stillConnected = await this.handshakeLock(() =>
            resolveAfter(penalty && penalty + 501).then(() => device.handshake()),
        );

        if (!stillConnected) {
            return;
        }
        this.devices.push(device);

        device.lifecycle.on(DEVICE.CONNECT, () => this.emit(DEVICE.CONNECT, device));
        device.lifecycle.on(DEVICE.CHANGED, () => this.emit(DEVICE.CHANGED, device));
        device.lifecycle.on(DEVICE.CONNECT_UNACQUIRED, () =>
            this.emit(DEVICE.CONNECT_UNACQUIRED, device),
        );
        device.lifecycle.on(DEVICE.TREZOR_PUSH_NOTIFICATION, payload => {
            this.emit(DEVICE.TREZOR_PUSH_NOTIFICATION, {
                device,
                ...payload,
            });
        });
        device.lifecycle.on(DEVICE.DISCONNECT, () => {
            device.lifecycle.removeAllListeners();
            this.authPenaltyManager.remove(device);
            const index = this.devices.indexOf(device);
            if (index >= 0) this.devices.splice(index, 1);
            this.emit(DEVICE.DISCONNECT, device);
        });

        this.emit(device.isUnacquired() ? DEVICE.CONNECT_UNACQUIRED : DEVICE.CONNECT, device);
    }

    async init({
        apiTypes,
        transportReconnect,
        pendingTransportEvent,
        _transports,
    }: InitParams = {}) {
        this.transportReconnect = transportReconnect ?? false;

        // For tests: use injected transport if provided
        if (_transports && _transports.length > 0) {
            this.transport = _transports[0];
        } else {
            // Create or update transport
            const transports = await this.updateTransports(
                this.transport ? [this.transport] : [],
                apiTypes,
            );
            this.transport = transports[0];
        }

        if (!this.transport) {
            this.emit(TRANSPORT.ERROR, { error: 'No transport available' });
            return;
        }

        try {
            const initResult = await this.transport.init();
            if (!initResult.success) {
                throw new Error(initResult.error);
            }

            await this.initializeTransport(
                this.transport,
                pendingTransportEvent ?? false,
                new AbortController().signal,
            );
            this.emit(TRANSPORT.START, getTransportInfo(this.transport));
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : 'Transport initialization failed';
            this.emit(TRANSPORT.ERROR, { error: errorMessage });

            // If reconnection is enabled, retry after delay
            if (this.transportReconnect) {
                setTimeout(
                    () => this.init({ apiTypes, transportReconnect, pendingTransportEvent }),
                    1000,
                );
            }
        }
    }

    private async initializeTransport(
        transport: Transport,
        pendingTransportEvent: boolean,
        signal: AbortSignal,
    ) {
        /**
         * listen to change of descriptors reported by @trezor/transport
         * we can say that this part lets connect know about
         * "external activities with trezor devices" such as device was connected/disconnected
         * or it was acquired or released by another application.
         * releasing/acquiring device by this application is not solved here but directly
         * where transport.acquire, transport.release is called
         */
        transport.on(TRANSPORT.DEVICE_CONNECTED, d => this.onDeviceConnected(d, transport));
        transport.listen();

        // enumerating for the first time. we intentionally postpone emitting TRANSPORT_START
        // event until we read descriptors for the first time
        const enumerateResult = await transport.enumerate({ signal });

        if (!enumerateResult.success) {
            throw new Error(enumerateResult.error);
        }

        const descriptors = enumerateResult.payload;

        transport.handleDescriptorsChange(descriptors);

        if (pendingTransportEvent && descriptors.length) {
            await this.waitForDevices(transport, signal);
        }
    }

    /**
     * Returned promise:
     * - resolves when all the devices visible from given transport were handshaked
     * - resolves after 10 secs (in order not to get stuck waiting for devices)
     * - rejects when aborted (e.g. because of DeviceList reinit)
     * - rejects when given transport emits an error
     *
     * Old note: when TRANSPORT.START_PENDING is emitted, we already know that transport is available
     * but we wait with emitting TRANSPORT.START event to the implementator until we read from devices
     * in case something wrong happens and we never finish reading from devices for whatever reason
     * implementator could get stuck waiting from TRANSPORT.START event forever. To avoid this,
     * we emit TRANSPORT.START event after autoResolveTransportEventTimeout
     */
    private waitForDevices(transport: Transport, signal: AbortSignal) {
        const { promise, reject, resolve } = createDeferred();

        const onAbort = () => reject(signal.reason);
        signal.addEventListener('abort', onAbort);

        const onError = (error: string) => reject(new Error(error));
        transport.once(TRANSPORT.ERROR, onError);

        const autoResolveTransportEventTimeout = setTimeout(resolve, 10000);

        // this works because all initial device handshakes are started synchronously from
        // initializeTransport -> transport.handleDescriptorsChange so this `resolve`
        // in handshakeLock cannot be called before all of them are resolved
        this.handshakeLock(resolve);

        return promise.finally(() => {
            transport.off(TRANSPORT.ERROR, onError);
            signal.removeEventListener('abort', onAbort);
            clearTimeout(autoResolveTransportEventTimeout);
        });
    }

    getDeviceCount() {
        return this.devices.length;
    }

    getPrioritizedDevices() {
        return [...this.devices].sort(
            (a, b) =>
                // USB transport is prioritized over Bluetooth
                (a.descriptor.apiType === 'bluetooth' ? 1 : 0) -
                (b.descriptor.apiType === 'bluetooth' ? 1 : 0),
        );
    }

    getAllDevices() {
        return this.getPrioritizedDevices() as readonly Device[];
    }

    getOnlyDevice(): Device | undefined {
        return this.devices.length === 1 ? this.devices[0] : undefined;
    }

    getDeviceByPath(path: DeviceUniquePath): Device | undefined {
        return this.getPrioritizedDevices().find(d => d.getUniquePath() === path);
    }

    getDeviceByStaticState(state: StaticSessionId): Device | undefined {
        const deviceId = state.split('@')[1].split(':')[0];

        return this.getPrioritizedDevices().find(d => d.features?.device_id === deviceId);
    }

    async dispose() {
        this.removeAllListeners();

        if (this.transport) {
            this.transport.stop();
            this.transport = undefined;
        }
    }

    async enumerate() {
        if (!this.transport) return;

        const res = await this.transport.enumerate();
        if (res.success) {
            this.transport.handleDescriptorsChange(res.payload);
        }
    }

    addAuthPenalty(device: Device) {
        return this.authPenaltyManager.add(device);
    }

    removeAuthPenalty(device: Device) {
        return this.authPenaltyManager.remove(device);
    }
}
