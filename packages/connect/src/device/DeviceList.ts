// original file https://github.com/trezor/connect/blob/develop/src/js/device/DeviceList.js

import {
    TypedEmitter,
    arrayDistinct,
    arrayPartition,
    createDeferred,
    getSynchronize,
    isNotUndefined,
} from '@trezor/utils';
import {
    BridgeTransport,
    WebUsbTransport,
    NodeUsbTransport,
    UdpTransport,
    Transport,
    TRANSPORT,
    isTransportInstance,
} from '@trezor/transport';
import { Descriptor, PathPublic } from '@trezor/transport/src/types';
import type { TransportApiType } from '@trezor/transport/src/transports/abstract';

import { ERRORS } from '../constants';
import { DEVICE, TransportError, TransportInfo } from '../events';
import { Device } from './Device';
import { ConnectSettings, DeviceUniquePath, StaticSessionId } from '../types';
import { getBridgeInfo } from '../data/transportInfo';
import { initLog } from '../utils/debug';
import { abortablePromise } from '../utils/abortablePromise';
import { typedObjectKeys } from '../types/utils';

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

type DeviceTransport = Pick<Device, 'transport' | 'transportPath'>;

const createDeviceCollection = () => {
    let devices: Device[] = [];

    const isEqual = (a: DeviceTransport) => (b: DeviceTransport) =>
        a.transport === b.transport && a.transportPath === b.transportPath;

    const get = (transportPath: PathPublic, transport: Transport) =>
        devices.find(isEqual({ transport, transportPath }));

    const all = (): readonly Device[] => devices;

    const add = (device: Device) => {
        const index = devices.findIndex(isEqual(device));
        if (index >= 0) devices[index] = device;
        else devices.push(device);
    };

    const remove = (transportPath: PathPublic, transport: Transport) => {
        const index = devices.findIndex(isEqual({ transport, transportPath }));
        const [removed] = index >= 0 ? devices.splice(index, 1) : [undefined];

        return removed;
    };

    const clear = (transport?: Transport) => {
        let removed: Device[];
        [removed, devices] = arrayPartition(devices, d => !transport || d.transport === transport);

        return removed;
    };

    return { get, all, add, remove, clear };
};

const getTransportInfo = (transport: Transport) => ({
    apiType: transport.apiType,
    type: transport.name,
    version: transport.version,
    outdated: transport.isOutdated,
});

interface DeviceListEvents {
    [TRANSPORT.START]: TransportInfo;
    [TRANSPORT.ERROR]: TransportError;
    [DEVICE.CONNECT]: Device;
    [DEVICE.CONNECT_UNACQUIRED]: Device;
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

type ConstructorParams = Pick<
    ConnectSettings,
    'priority' | 'debug' | '_sessionsBackgroundUrl' | 'manifest'
> & {
    messages: Record<string, any>;
};
type InitParams = Pick<
    ConnectSettings,
    'transports' | 'pendingTransportEvent' | 'transportReconnect'
>;

type ApiTypeMap<T> = Partial<Record<TransportApiType, T>>;

export class DeviceList extends TypedEmitter<DeviceListEvents> implements IDeviceList {
    private readonly transport: ApiTypeMap<Transport> = {};

    // array of transport that might be used in this environment
    private transports: Transport[] = [];

    private readonly devices = createDeviceCollection();
    private deviceCounter = Date.now();

    private readonly handshakeLock;
    private readonly authPenaltyManager;

    private transportCommonArgs;

    isConnected(): this is DeviceList {
        return !!Object.keys(this.transport).length;
    }

    pendingConnection() {
        const pending = Object.values(this.locks)
            .map(({ promise }) => promise)
            .filter(isNotUndefined);

        if (pending.length) return Promise.all(pending).then(() => {});
    }

    getActiveTransports() {
        return Object.values(this.transport).map(getTransportInfo);
    }

    private readonly locks: ApiTypeMap<{
        promise?: Promise<void>;
        abort?: AbortController;
        abortMessage?: string;
        sequence: number;
    }> = {};

    private async transportLock<T extends void>(
        apiType: TransportApiType,
        abortMessage: string,
        action: (signal: AbortSignal) => Promise<T>,
    ): Promise<T> {
        const lock = this.locks[apiType] ?? (this.locks[apiType] = { sequence: 0 });
        lock.abortMessage = abortMessage;
        const sequence = ++lock.sequence;

        while (lock.promise) {
            lock.abort?.abort(new Error(abortMessage));
            await lock.promise.catch(() => {});
        }

        if (sequence !== lock.sequence) return Promise.reject(new Error(lock.abortMessage));

        lock.abort = new AbortController();
        lock.promise = action(lock.abort.signal).finally(() => {
            delete lock.abort;
            delete lock.promise;
        });

        return lock.promise as Promise<T>;
    }

    constructor({
        messages,
        priority,
        debug,
        _sessionsBackgroundUrl,
        manifest,
    }: ConstructorParams) {
        super();

        const transportLogger = initLog('@trezor/transport', debug);

        this.handshakeLock = getSynchronize();
        this.authPenaltyManager = createAuthPenaltyManager(priority);
        this.transportCommonArgs = {
            messages,
            logger: transportLogger,
            sessionsBackgroundUrl: _sessionsBackgroundUrl,
            id: manifest?.appUrl || 'unknown app',
        };
    }

    private tryGetTransport(name: string) {
        return this.transports.find(t => t.name === name);
    }

    private getOrCreateTransport(
        transportType: NonNullable<ConnectSettings['transports']>[number],
    ) {
        const { transportCommonArgs } = this;

        if (typeof transportType === 'string') {
            const existing = this.tryGetTransport(transportType);
            if (existing) return existing;

            switch (transportType) {
                case 'WebUsbTransport':
                    return new WebUsbTransport(transportCommonArgs);
                case 'NodeUsbTransport':
                    return new NodeUsbTransport(transportCommonArgs);
                case 'BridgeTransport':
                    return new BridgeTransport({
                        latestVersion: getBridgeInfo().version.join('.'),
                        ...transportCommonArgs,
                    });
                case 'UdpTransport':
                    return new UdpTransport(transportCommonArgs);
            }
        } else if (typeof transportType === 'function' && 'prototype' in transportType) {
            const transportInstance = new transportType(transportCommonArgs);
            if (isTransportInstance(transportInstance)) {
                return this.tryGetTransport(transportInstance.name) ?? transportInstance;
            }
        } else if (isTransportInstance(transportType)) {
            if (this.tryGetTransport(transportType.name)) {
                return transportType;
            }

            // custom Transport might be initialized without messages, update them if so
            if (!transportType.getMessage()) {
                transportType.updateMessages(transportCommonArgs.messages);
            }

            return transportType;
        }

        // runtime check
        throw ERRORS.TypedError(
            'Runtime',
            `DeviceList.init: transports[] of unexpected type: ${transportType}`,
        );
    }

    private createTransports(transports: ConnectSettings['transports']) {
        // BridgeTransport is the ultimate fallback
        const transportTypes = transports?.length ? transports : ['BridgeTransport' as const];

        return transportTypes.map(this.getOrCreateTransport.bind(this));
    }

    private onDeviceConnected(descriptor: Descriptor, transport: Transport) {
        const id = (this.deviceCounter++).toString(16).slice(-8);
        const device = new Device({
            id: DeviceUniquePath(id),
            transport,
            descriptor,
            listener: lifecycle => this.emit(lifecycle, device),
        });
        this.devices.add(device);

        const penalty = this.authPenaltyManager.get();
        this.handshakeLock(async () => {
            if (this.devices.get(descriptor.path, transport)) {
                // device wasn't removed while waiting for lock
                await device.handshake(penalty);
            }
        });
    }

    private onDeviceDisconnected(descriptor: Descriptor, transport: Transport) {
        const device = this.devices.remove(descriptor.path, transport);
        device?.disconnect();
    }

    private onDeviceSessionChanged(descriptor: Descriptor, transport: Transport) {
        const device = this.devices.get(descriptor.path, transport);
        device?.updateDescriptor(descriptor);
    }

    private onDeviceRequestRelease(descriptor: Descriptor, transport: Transport) {
        const device = this.devices.get(descriptor.path, transport);
        device?.usedElsewhere();
    }

    async init(initParams: InitParams = {}) {
        // throws when unknown transport is requested, in that case nothing is changed
        this.transports = this.createTransports(initParams.transports);

        const promises = this.transports
            .map(t => t.apiType)
            .concat(typedObjectKeys(this.transport))
            .concat(typedObjectKeys(this.locks))
            .filter(arrayDistinct)
            .map(apiType =>
                this.transportLock(apiType, 'New init', signal =>
                    this.createInitPromise(apiType, initParams, signal),
                ),
            );

        await Promise.all(promises);
    }

    private async createInitPromise(
        apiType: TransportApiType,
        initParams: InitParams,
        abortSignal: AbortSignal,
    ) {
        try {
            const transports = this.transports.filter(t => t.apiType === apiType);
            const transport = transports.length
                ? await this.selectTransport(transports, abortSignal)
                : undefined;
            const oldTransport = this.transport[apiType];
            if (oldTransport !== transport) {
                if (oldTransport) {
                    delete this.transport[apiType];
                    await this.stopTransport(oldTransport);
                    if (!transport) {
                        this.emit(TRANSPORT.ERROR, { apiType, error: 'Transport disabled' });
                    }
                }

                if (transport) {
                    try {
                        await this.initializeTransport(transport, initParams, abortSignal);
                    } catch (error) {
                        await this.stopTransport(transport);
                        throw error;
                    }

                    transport.on(TRANSPORT.ERROR, error => {
                        this.emit(TRANSPORT.ERROR, { apiType, error });
                        this.transportLock(apiType, 'Transport error', async signal => {
                            delete this.transport[apiType];
                            await this.stopTransport(transport);
                            if (initParams.transportReconnect) {
                                await this.createReconnectDelay(signal);
                                await this.createInitPromise(apiType, initParams, signal);
                            }
                        }).catch(() => {});
                    });

                    this.transport[apiType] = transport;
                    this.emit(TRANSPORT.START, getTransportInfo(transport));
                }
            }
        } catch (error) {
            this.emit(TRANSPORT.ERROR, { apiType, error: error?.message });
            if (initParams.transportReconnect && !abortSignal.aborted) {
                this.transportLock(apiType, 'Reconnecting', async signal => {
                    await this.createReconnectDelay(signal);
                    await this.createInitPromise(apiType, initParams, signal);
                }).catch(() => {});
            }
        }
    }

    private createReconnectDelay(signal: AbortSignal) {
        const { promise, resolve } = abortablePromise(signal);
        const timeout = setTimeout(resolve, 1000);

        return promise.finally(() => clearTimeout(timeout));
    }

    private async selectTransport(
        [transport, ...rest]: Transport[],
        signal: AbortSignal,
    ): Promise<Transport> {
        if (signal.aborted) throw new Error(signal.reason);
        if (transport === this.transport[transport.apiType]) return transport;
        const result = await transport.init({ signal });
        if (result.success) return transport;
        else if (rest.length) return this.selectTransport(rest, signal);
        else throw new Error(result.error);
    }

    private async initializeTransport(
        transport: Transport,
        initParams: InitParams,
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
        transport.on(TRANSPORT.DEVICE_DISCONNECTED, d => this.onDeviceDisconnected(d, transport));
        transport.on(TRANSPORT.DEVICE_SESSION_CHANGED, d =>
            this.onDeviceSessionChanged(d, transport),
        );
        transport.on(TRANSPORT.DEVICE_REQUEST_RELEASE, d =>
            this.onDeviceRequestRelease(d, transport),
        );

        // enumerating for the first time. we intentionally postpone emitting TRANSPORT_START
        // event until we read descriptors for the first time
        const enumerateResult = await transport.enumerate({ signal });

        if (!enumerateResult.success) {
            throw new Error(enumerateResult.error);
        }

        const descriptors = enumerateResult.payload;

        const waitForDevicesPromise =
            initParams.pendingTransportEvent && descriptors.length
                ? this.waitForDevices(transport, descriptors, signal)
                : Promise.resolve();

        transport.handleDescriptorsChange(descriptors);
        transport.listen();

        await waitForDevicesPromise;
    }

    /**
     * Returned promise:
     * - resolves when all the devices visible from given transport were acquired (or at least tried to)
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
    private waitForDevices(transport: Transport, descriptors: Descriptor[], signal: AbortSignal) {
        const { promise, reject, resolve } = createDeferred();

        const onAbort = () => reject(signal.reason);
        signal.addEventListener('abort', onAbort);

        const onError = (error: string) => reject(new Error(error));
        transport.once(TRANSPORT.ERROR, onError);

        const autoResolveTransportEventTimeout = setTimeout(resolve, 10000);

        const remaining = descriptors.slice();

        const onDeviceEvent = (device: Device) => {
            const index = remaining.findIndex(
                d => d.path === device.transportPath && transport === device.transport,
            );
            if (index >= 0) remaining.splice(index, 1);
            if (!remaining.length) resolve();
        };

        // listen for self emitted events and resolve pending transport event if needed
        this.on(DEVICE.CONNECT, onDeviceEvent);
        this.on(DEVICE.CONNECT_UNACQUIRED, onDeviceEvent);
        this.on(DEVICE.DISCONNECT, onDeviceEvent);

        return promise.finally(() => {
            transport.off(TRANSPORT.ERROR, onError);
            signal.removeEventListener('abort', onAbort);
            clearTimeout(autoResolveTransportEventTimeout);
            this.off(DEVICE.CONNECT, onDeviceEvent);
            this.off(DEVICE.CONNECT_UNACQUIRED, onDeviceEvent);
            this.off(DEVICE.DISCONNECT, onDeviceEvent);
        });
    }

    getDeviceCount() {
        return this.devices.all().length;
    }

    getAllDevices() {
        return this.devices.all();
    }

    getOnlyDevice(): Device | undefined {
        return this.getDeviceCount() === 1 ? this.devices.all()[0] : undefined;
    }

    getDeviceByPath(path: DeviceUniquePath): Device | undefined {
        return this.devices.all().find(d => d.getUniquePath() === path);
    }

    getDeviceByStaticState(state: StaticSessionId): Device | undefined {
        const deviceId = state.split('@')[1].split(':')[0];

        return this.devices.all().find(d => d.features?.device_id === deviceId);
    }

    async dispose() {
        this.removeAllListeners();

        const promises = typedObjectKeys(this.transport)
            .concat(typedObjectKeys(this.locks))
            .filter(arrayDistinct)
            .map(apiType =>
                this.transportLock(apiType, 'Disposing', async () => {
                    const transport = this.transport[apiType];
                    if (transport) {
                        delete this.transport[apiType];
                        await this.stopTransport(transport);
                    }
                }),
            );

        await Promise.all(promises);
    }

    private async stopTransport(transport: Transport) {
        const devices = this.devices.clear(transport);

        // disconnect devices
        devices.forEach(device => {
            // device.disconnect();
            this.emit(DEVICE.DISCONNECT, device);
        });

        // release all devices
        await Promise.all(
            devices.map(async device => {
                this.authPenaltyManager.remove(device); // TODO is this right?
                await device.dispose();
            }),
        );

        // now we can be relatively sure that release calls have been dispatched
        // and we can safely kill all async subscriptions in transport layer
        transport?.stop();
    }

    async enumerate() {
        const promises = Object.values(this.transport).map(async transport => {
            const res = await transport.enumerate();

            if (!res.success) {
                return;
            }

            res.payload.forEach(d => {
                this.devices.get(d.path, transport)?.updateDescriptor(d);
            });
        });

        await Promise.all(promises);
    }

    addAuthPenalty(device: Device) {
        return this.authPenaltyManager.add(device);
    }

    removeAuthPenalty(device: Device) {
        return this.authPenaltyManager.remove(device);
    }
}
