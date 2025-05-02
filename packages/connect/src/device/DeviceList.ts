// original file https://github.com/trezor/connect/blob/develop/src/js/device/DeviceList.js

import { TRANSPORT, Transport } from '@trezor/transport';
import type { TransportApiType } from '@trezor/transport/src/transports/abstract';
import { Descriptor } from '@trezor/transport/src/types';
import {
    TypedEmitter,
    arrayDistinct,
    arrayPartition,
    createDeferred,
    getSynchronize,
    isNotUndefined,
    typedObjectKeys,
} from '@trezor/utils';

import { ERRORS } from '../constants';
import { DEVICE, TransportError, TransportInfo } from '../events';
import { Device } from './Device';
import { ConnectSettings, DeviceUniquePath, StaticSessionId } from '../types';
import { createTransportList } from './TransportList';
import { TransportManager } from './TransportManager';
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

export class DeviceList extends TypedEmitter<DeviceListEvents> implements IDeviceList {
    private readonly transportManagers: Partial<Record<TransportApiType, TransportManager>> = {};

    // array of transport that might be used in this environment
    private transports: Transport[] = [];
    private devices: Device[] = [];
    private deviceCounter = Date.now();

    private readonly handshakeLock;
    private readonly authPenaltyManager;

    private updateTransports;

    private getConnectedTransports() {
        return Object.values(this.transportManagers)
            .map(manager => manager.get())
            .filter(isNotUndefined);
    }

    isConnected(): this is DeviceList {
        return !!this.getConnectedTransports().length;
    }

    pendingConnection() {
        const pending = Object.values(this.transportManagers)
            .map(manager => manager.pending())
            .filter(isNotUndefined);

        if (pending.length) return Promise.all(pending).then(() => {});
    }

    getActiveTransports() {
        return this.getConnectedTransports().map(getTransportInfo);
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
        this.updateTransports = createTransportList({
            messages,
            logger: transportLogger,
            sessionsBackgroundUrl: _sessionsBackgroundUrl,
            id: manifest?.appName || manifest?.appUrl || 'unknown app',
        });
    }

    private onDeviceConnected(descriptor: Descriptor, transport: Transport) {
        const id = (this.deviceCounter++).toString(16).slice(-8);
        const device = new Device({
            id: DeviceUniquePath(id),
            transport,
            descriptor,
            listener: lifecycle => {
                if (lifecycle === DEVICE.DISCONNECT) {
                    const index = this.devices.indexOf(device);
                    if (index >= 0) this.devices.splice(index, 1);
                }
                this.emit(lifecycle, device);
            },
        });
        this.devices.push(device);

        const penalty = this.authPenaltyManager.get();
        this.handshakeLock(async () => {
            if (this.devices.includes(device)) {
                // device wasn't removed while waiting for lock
                await device.handshake(penalty);
            }
        });
    }

    private getOrCreateTransportManager(apiType: TransportApiType) {
        if (!this.transportManagers[apiType]) {
            const manager = new TransportManager({
                startTransport: this.startTransport.bind(this),
                stopTransport: this.stopTransport.bind(this),
            });
            manager.on(TRANSPORT.START, transport =>
                this.emit(TRANSPORT.START, getTransportInfo(transport)),
            );
            manager.on(TRANSPORT.ERROR, error => this.emit(TRANSPORT.ERROR, { apiType, error }));
            this.transportManagers[apiType] = manager;
        }

        return this.transportManagers[apiType];
    }

    async init({ transports, transportReconnect, pendingTransportEvent }: InitParams = {}) {
        // throws when unknown transport is requested, in that case nothing is changed
        this.transports = this.updateTransports(this.transports, transports);

        const promises = this.transports
            .map(t => t.apiType)
            .concat(typedObjectKeys(this.transportManagers))
            .filter(arrayDistinct)
            .map(apiType =>
                this.getOrCreateTransportManager(apiType).init({
                    transports: this.transports.filter(t => t.apiType === apiType),
                    transportReconnect,
                    pendingTransportEvent,
                }),
            );

        await Promise.all(promises);
    }

    private async startTransport(
        transport: Transport,
        pendingTransportEvent: boolean,
        signal: AbortSignal,
    ) {
        try {
            await this.initializeTransport(transport, pendingTransportEvent, signal);
        } catch (err) {
            this.stopTransport(transport);
            throw err;
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

        // enumerating for the first time. we intentionally postpone emitting TRANSPORT_START
        // event until we read descriptors for the first time
        const enumerateResult = await transport.enumerate({ signal });

        if (!enumerateResult.success) {
            throw new Error(enumerateResult.error);
        }

        const descriptors = enumerateResult.payload;

        const waitForDevicesPromise =
            pendingTransportEvent && descriptors.length
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
        return this.devices.length;
    }

    getAllDevices() {
        return this.devices as readonly Device[];
    }

    getOnlyDevice(): Device | undefined {
        return this.devices.length === 1 ? this.devices[0] : undefined;
    }

    getDeviceByPath(path: DeviceUniquePath): Device | undefined {
        return this.devices.find(d => d.getUniquePath() === path);
    }

    getDeviceByStaticState(state: StaticSessionId): Device | undefined {
        const deviceId = state.split('@')[1].split(':')[0];

        return this.devices.find(d => d.features?.device_id === deviceId);
    }

    async dispose() {
        this.removeAllListeners();

        const promises = Object.values(this.transportManagers).map(manager => manager.dispose());

        await Promise.all(promises);
    }

    private stopTransport(transport: Transport) {
        let removed: Device[];
        [removed, this.devices] = arrayPartition(
            this.devices,
            d => !transport || d.transport === transport,
        );

        // disconnect devices
        removed.forEach(device => {
            // device.disconnect();
            this.emit(DEVICE.DISCONNECT, device);
            this.authPenaltyManager.remove(device);
            device.dispose();
        });

        // now we can be relatively sure that release calls have been dispatched
        // and we can safely kill all async subscriptions in transport layer
        transport?.stop();
    }

    async enumerate() {
        const promises = this.getConnectedTransports().map(async transport => {
            const res = await transport.enumerate();
            if (res.success) {
                transport.handleDescriptorsChange(res.payload);
            }
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
