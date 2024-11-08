// original file https://github.com/trezor/connect/blob/develop/src/js/device/DeviceList.js

import { TypedEmitter, getSynchronize } from '@trezor/utils';
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

import { ERRORS } from '../constants';
import { DEVICE, TransportInfo } from '../events';
import { Device } from './Device';
import {
    ConnectSettings,
    DeviceUniquePath,
    Device as DeviceTyped,
    StaticSessionId,
} from '../types';
import { getBridgeInfo } from '../data/transportInfo';
import { initLog } from '../utils/debug';
import { abortablePromise } from '../utils/abortablePromise';

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
    const devices: Device[] = [];

    const isEqual = (a: DeviceTransport) => (b: DeviceTransport) =>
        a.transport === b.transport && a.transportPath === b.transportPath;

    const get = (transportPath: PathPublic, transport: Transport) =>
        devices.find(isEqual({ transport, transportPath }));

    const all = () => devices.slice();

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

    const clear = () => {
        return devices.splice(0, devices.length);
    };

    return { get, all, add, remove, clear };
};

interface DeviceListEvents {
    [TRANSPORT.START]: TransportInfo;
    [TRANSPORT.ERROR]: string;
    [DEVICE.CONNECT]: DeviceTyped;
    [DEVICE.CONNECT_UNACQUIRED]: DeviceTyped;
    [DEVICE.DISCONNECT]: DeviceTyped;
    [DEVICE.CHANGED]: DeviceTyped;
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
    if (!deviceList.isConnected()) throw ERRORS.TypedError('Transport_Missing');
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
    // @ts-expect-error has no initializer
    private transport: Transport;

    // array of transport that might be used in this environment
    private transports: Transport[];

    private readonly devices = createDeviceCollection();
    private deviceCounter = Date.now();

    private readonly handshakeLock;
    private readonly authPenaltyManager;

    private initTask?: {
        promise: Promise<void>;
        abort: AbortController['abort'];
    };

    private transportCommonArgs;

    isConnected(): this is DeviceList {
        return !!this.transport;
    }

    pendingConnection() {
        return this.initTask?.promise;
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

        this.transports = [
            new BridgeTransport({
                latestVersion: getBridgeInfo().version.join('.'),
                ...this.transportCommonArgs,
            }),
        ];
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
            listener: lifecycle => this.emit(lifecycle, device.toMessageObject()),
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

    /**
     * Init @trezor/transport and do something with its results
     */
    async init(initParams: InitParams = {}) {
        // abort all potentially queued inits
        while (this.initTask) {
            this.initTask.abort(new Error('Reinited'));
            await this.initTask.promise.catch(() => {});
        }

        // throws when unknown transport is requested, in that case nothing is changed
        this.transports = this.createTransports(initParams.transports);
        this.initTask = this.createInitTask(initParams);

        return this.initTask.promise;
    }

    private async stopActiveTransport() {
        // if newly set transports don't include active transport, kill it
        if (this.transport && !this.transports.includes(this.transport)) {
            // stop cannot be aborted as active devices should be released first
            await this.stopTransport(this.transport);
            // @ts-expect-error will be fixed later
            this.transport = undefined;
        }
    }

    private createInitTask(initParams: InitParams) {
        const abort = new AbortController();

        return {
            abort: () => abort.abort(),
            promise: this.stopActiveTransport().then(() =>
                this.createInitPromise(initParams, abort.signal),
            ),
        };
    }

    private createReconnectTask(initParams: InitParams) {
        const abort = new AbortController();
        const { promise, resolve } = abortablePromise(abort.signal);
        const timeout = setTimeout(resolve, 1000);

        return {
            abort: () => abort.abort(),
            promise: promise
                .finally(() => clearTimeout(timeout))
                .then(() => this.createInitPromise(initParams, abort.signal)),
        };
    }

    private createInitPromise(initParams: InitParams, signal: AbortSignal) {
        return this.selectTransport(this.transports, signal)
            .then(transport => this.initializeTransport(transport, initParams, signal))
            .then(transport => {
                this.transport = transport;
                this.emit(TRANSPORT.START, this.getTransportInfo());
                this.initTask = undefined;
            })
            .catch(error => {
                this.cleanup();
                this.emit(TRANSPORT.ERROR, error);
                this.initTask = initParams.transportReconnect
                    ? this.createReconnectTask(initParams)
                    : undefined;
            });
    }

    private async selectTransport(
        [transport, ...rest]: Transport[],
        signal: AbortSignal,
    ): Promise<Transport> {
        if (signal.aborted) throw new Error(signal.reason);
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

        // just like transport emits updates, it may also start producing errors, for example bridge process crashes.
        transport.on(TRANSPORT.ERROR, error => {
            this.cleanup();
            this.emit(TRANSPORT.ERROR, error);
            if (initParams.transportReconnect) {
                this.initTask?.abort(new Error('Transport error'));
                this.initTask = this.createReconnectTask(initParams);
            }
        });

        // enumerating for the first time. we intentionally postpone emitting TRANSPORT_START
        // event until we read descriptors for the first time
        const enumerateResult = await transport.enumerate({ signal });

        if (!enumerateResult.success) {
            throw new Error(enumerateResult.error);
        }

        const descriptors = enumerateResult.payload;

        const waitForDevicesPromise =
            initParams.pendingTransportEvent && descriptors.length
                ? this.waitForDevices(descriptors.length, 10000, signal)
                : Promise.resolve();

        transport.handleDescriptorsChange(descriptors);
        transport.listen();

        await waitForDevicesPromise;

        return transport;
    }

    private waitForDevices(deviceCount: number, autoResolveMs: number, signal: AbortSignal) {
        const { promise, resolve } = abortablePromise(signal);
        let transportStartPending = deviceCount;

        /**
         * when TRANSPORT.START_PENDING is emitted, we already know that transport is available
         * but we wait with emitting TRANSPORT.START event to the implementator until we read from devices
         * in case something wrong happens and we never finish reading from devices for whatever reason
         * implementator could get stuck waiting from TRANSPORT.START event forever. To avoid this,
         * we emit TRANSPORT.START event after autoResolveTransportEventTimeout
         */
        const autoResolveTransportEventTimeout = setTimeout(resolve, autoResolveMs);

        const onDeviceConnect = () => {
            transportStartPending--;
            if (transportStartPending === 0) {
                resolve();
            }
        };

        // listen for self emitted events and resolve pending transport event if needed
        this.on(DEVICE.CONNECT, onDeviceConnect);
        this.on(DEVICE.CONNECT_UNACQUIRED, onDeviceConnect);

        return promise.finally(() => {
            clearTimeout(autoResolveTransportEventTimeout);
            this.off(DEVICE.CONNECT, onDeviceConnect);
            this.off(DEVICE.CONNECT_UNACQUIRED, onDeviceConnect);
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
        return this.getAllDevices().find(d => d.getUniquePath() === path);
    }

    getDeviceByStaticState(state: StaticSessionId): Device | undefined {
        const deviceId = state.split('@')[1].split(':')[0];

        return this.getAllDevices().find(d => d.features?.device_id === deviceId);
    }

    transportType() {
        return this.transport.name;
    }

    getTransportInfo(): TransportInfo {
        return {
            type: this.transportType(),
            version: this.transport.version,
            outdated: this.transport.isOutdated,
        };
    }

    dispose() {
        this.removeAllListeners();
        this.initTask?.abort(new Error('Disposed'));

        return this.cleanup();
    }

    async cleanup() {
        const { transport } = this;
        // @ts-expect-error will be fixed later
        this.transport = undefined;
        this.authPenaltyManager.clear();

        await this.stopTransport(transport);
    }

    private async stopTransport(transport: Transport) {
        const devices = this.devices.clear();

        // disconnect devices
        devices.forEach(device => {
            // device.disconnect();
            this.emit(DEVICE.DISCONNECT, device.toMessageObject());
        });

        // release all devices
        await Promise.all(devices.map(device => device.dispose()));

        // now we can be relatively sure that release calls have been dispatched
        // and we can safely kill all async subscriptions in transport layer
        transport?.stop();
    }

    // TODO this is fugly
    async enumerate(transport = this.transport) {
        const res = await transport.enumerate();

        if (!res.success) {
            return;
        }

        res.payload.forEach(d => {
            this.devices.get(d.path, transport)?.updateDescriptor(d);
        });
    }

    addAuthPenalty(device: Device) {
        return this.authPenaltyManager.add(device);
    }

    removeAuthPenalty(device: Device) {
        return this.authPenaltyManager.remove(device);
    }
}
