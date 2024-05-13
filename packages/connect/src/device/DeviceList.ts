// original file https://github.com/trezor/connect/blob/develop/src/js/device/DeviceList.js

import { TypedEmitter, Deferred, createDeferred, promiseAllSequence } from '@trezor/utils';
import {
    BridgeTransport,
    WebUsbTransport,
    NodeUsbTransport,
    UdpTransport,
    Transport,
    TRANSPORT,
    Descriptor,
    TRANSPORT_ERROR,
    isTransportInstance,
    DeviceDescriptorDiff,
} from '@trezor/transport';
import { ERRORS } from '../constants';
import { DEVICE, TransportInfo } from '../events';
import { Device } from './Device';
import type { ConnectSettings, Device as DeviceTyped } from '../types';

import { getBridgeInfo } from '../data/transportInfo';
import { initLog } from '../utils/debug';
import { resolveAfter } from '../utils/promiseUtils';

// custom log
const _log = initLog('DeviceList');

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

interface DeviceListEvents {
    [TRANSPORT.START]: TransportInfo;
    [TRANSPORT.ERROR]: string;
    [DEVICE.CONNECT]: DeviceTyped;
    [DEVICE.CONNECT_UNACQUIRED]: DeviceTyped;
    [DEVICE.DISCONNECT]: DeviceTyped;
    [DEVICE.CHANGED]: DeviceTyped;
    [DEVICE.RELEASED]: DeviceTyped;
    [DEVICE.ACQUIRED]: DeviceTyped;
}

export interface IDeviceList {
    isConnected(): this is DeviceList;
    pendingConnection(): Promise<void> | undefined;
    setTransports: DeviceList['setTransports'];
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

type ConstructorParams = Pick<ConnectSettings, 'priority' | 'debug' | '_sessionsBackgroundUrl'> & {
    messages: Record<string, any>;
};
type InitParams = Pick<ConnectSettings, 'pendingTransportEvent' | 'transportReconnect'>;

export class DeviceList extends TypedEmitter<DeviceListEvents> implements IDeviceList {
    // ts-expect-error has no initializer
    // private transport: Transport;

    // array of transport that might be used in this environment
    private transports: Transport[];

    private devices: { [path: string]: Device } = {};

    private creatingDevicesDescriptors: { [k: string]: Descriptor } = {};
    private createDevicesQueue: Deferred[] = [];

    private readonly authPenaltyManager;

    private initPromise?: Promise<void>;

    private rejectPending?: (e: Error) => void;

    private transportCommonArgs;

    isConnected(): this is DeviceList {
        return this.transports.some(t => t.isActive());
    }

    pendingConnection() {
        return this.initPromise;
    }

    getActiveTransports() {
        return this.transports.filter(t => t.isActive());
    }

    constructor({ messages, priority, debug, _sessionsBackgroundUrl }: ConstructorParams) {
        super();

        const transportLogger = initLog('@trezor/transport', debug);

        this.authPenaltyManager = createAuthPenaltyManager(priority);
        this.transportCommonArgs = {
            messages,
            logger: transportLogger,
            sessionsBackgroundUrl: _sessionsBackgroundUrl,
        };

        this.transports = [
            new BridgeTransport({
                latestVersion: getBridgeInfo().version.join('.'),
                ...this.transportCommonArgs,
            }),
        ];
    }

    private createTransport(transportType: NonNullable<ConnectSettings['transports']>[number]) {
        const { transportCommonArgs } = this;

        if (typeof transportType === 'string') {
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
                return transportInstance;
            }
        } else if (isTransportInstance(transportType)) {
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

    setTransports(transports: ConnectSettings['transports']) {
        // we fill in `transports` with a reasonable fallback in src/index.
        // since web index is released into npm, we can not rely
        // on that that transports will be always set here. We need to provide a 'fallback of the last resort'
        const transportTypes = transports?.length ? transports : ['BridgeTransport' as const];

        this.transports = transportTypes.map(this.createTransport.bind(this));
    }

    private onTransportUpdate(diff: DeviceDescriptorDiff, transport: Transport) {
        diff.forEach(async ({ descriptor, ...category }) => {
            // whenever descriptors change we need to update them so that we can use them
            // in subsequent transport.acquire calls
            const path = `${transport.name}/${descriptor.path.toString()}`;
            const device = this.devices[path] as Device | undefined;

            // creatingDevicesDescriptors is needed, so that if *during* creating of Device,
            // other application acquires the device and changes the descriptor,
            // the new unacquired device has correct descriptor
            this.creatingDevicesDescriptors[path] = descriptor;

            switch (category.type) {
                case 'disconnected':
                    this.removeFromCreateDevicesQueue(path);

                    if (!device) break;

                    device.disconnect();
                    delete this.devices[path];
                    this.emit(DEVICE.DISCONNECT, device.toMessageObject());
                    break;

                case 'connected':
                    if (!(await this.waitForCreateDevicesQueue(path))) {
                        break;
                    }

                    const penalty = this.authPenaltyManager.get();

                    if (penalty) {
                        await resolveAfter(501 + penalty, null).promise;
                    }
                    if (this.creatingDevicesDescriptors[path].session == null) {
                        await this._createAndSaveDevice(descriptor, transport);
                    } else {
                        const device = this._createUnacquiredDevice(descriptor, transport);
                        this.devices[path] = device;
                        this.emit(DEVICE.CONNECT_UNACQUIRED, device.toMessageObject());
                    }

                    this.removeFromCreateDevicesQueue(path);
                    break;

                case 'acquired':
                    if (category.subtype === 'elsewhere') {
                        this.removeFromCreateDevicesQueue(path);
                        if (device) {
                            device.featuresNeedsReload = true;
                            device.interruptionFromOutside();
                        }
                    }

                    if (!device) break;

                    _log.debug('Event', DEVICE.CHANGED, device.toMessageObject());
                    this.emit(DEVICE.CHANGED, device.toMessageObject());

                    _log.debug('Event', DEVICE.ACQUIRED, device.toMessageObject());
                    this.emit(DEVICE.ACQUIRED, device.toMessageObject());

                    break;

                case 'released':
                    if (!device) break;

                    const methodStillRunning = !device.commands?.isDisposed();
                    if (methodStillRunning) {
                        device.keepTransportSession = false;
                    }

                    _log.debug('Event', DEVICE.CHANGED, device.toMessageObject());
                    this.emit(DEVICE.CHANGED, device.toMessageObject());

                    _log.debug('Event', DEVICE.RELEASED, device.toMessageObject());
                    this.emit(DEVICE.RELEASED, device.toMessageObject());

                    if (category.subtype === 'elsewhere') {
                        await resolveAfter(1000, null).promise;
                        // after device was released in another window wait for a while (the other window might
                        // have the intention of acquiring it again)
                        // and if the device is still released and has never been acquired before, acquire it here.
                        if (!device.isUsed() && device.isUnacquired() && !device.isInconsistent()) {
                            _log.debug('Create device from unacquired', device.toMessageObject());
                            await this._createAndSaveDevice(descriptor, transport);
                        }
                    }
                    break;
            }

            device?.updateDescriptor(descriptor);
        });
    }

    private async waitForCreateDevicesQueue(path: string) {
        const dfd = createDeferred(path);
        const prevQueue = this.createDevicesQueue.slice();
        this.createDevicesQueue.push(dfd);

        await promiseAllSequence(prevQueue.map(pr => () => pr.promise));

        // Return whether current pending action still in queue or it was
        // removed by disconnected/acquiredElsewhere events or dispose
        return this.createDevicesQueue.includes(dfd);
    }

    private removeFromCreateDevicesQueue(path: string) {
        const index = this.createDevicesQueue.findIndex(dfd => dfd.id === path);
        if (index >= 0) {
            const [dfd] = this.createDevicesQueue.splice(index, 1);
            dfd.resolve();
        }
    }

    /**
     * Init @trezor/transport and do something with its results
     */
    init(initParams: InitParams = {}) {
        // TODO is it ok to return first init promise in case of second call?
        if (!this.initPromise) {
            _log.debug('Initializing transports');
            this.initPromise = this.createInitPromise(initParams);
        }

        return this.initPromise;
    }

    private createInitPromise(initParams: InitParams) {
        return this.initTransports(this.transports)
            .then(transports =>
                promiseAllSequence(
                    transports.map(transport => () => this.setupTransport(transport, initParams)),
                ),
            )
            .then(() => {
                this.emit(TRANSPORT.START, this.getTransportInfo());
                this.initPromise = undefined;
            })
            .catch(error => {
                this.cleanup();
                this.emit(TRANSPORT.ERROR, error);
                this.initPromise = initParams.transportReconnect
                    ? this.createReconnectPromise(initParams)
                    : undefined;
            });
    }

    private createReconnectPromise(initParams: InitParams) {
        const { promise, reject } = resolveAfter(1000, initParams);
        this.rejectPending = reject;

        return promise.then(this.createInitPromise.bind(this));
    }

    // TODO may be in parallel?
    private async initTransports([transport, ...rest]: Transport[]): Promise<Transport[]> {
        if (!transport) return [];
        const result = await transport.init();
        if (result.success) return [transport, ...(await this.initTransports(rest))];
        else return this.initTransports(rest);
        // TODO what with errors?
    }

    private async setupTransport(transport: Transport, initParams: InitParams) {
        console.warn('setup', transport.name);
        /**
         * listen to change of descriptors reported by @trezor/transport
         * we can say that this part lets connect know about
         * "external activities with trezor devices" such as device was connected/disconnected
         * or it was acquired or released by another application.
         * releasing/acquiring device by this application is not solved here but directly
         * where transport.acquire, transport.release is called
         */
        transport.on(TRANSPORT.UPDATE, diff => this.onTransportUpdate(diff, transport));

        // just like transport emits updates, it may also start producing errors, for example bridge process crashes.
        transport.on(TRANSPORT.ERROR, error => {
            this.cleanup();
            this.emit(TRANSPORT.ERROR, error);
            if (initParams.transportReconnect) {
                this.initPromise = this.createReconnectPromise(initParams);
            }
        });

        console.warn('first enumerate', transport.name);

        // enumerating for the first time. we intentionally postpone emitting TRANSPORT_START
        // event until we read descriptors for the first time
        const enumerateResult = await transport.enumerate();

        console.warn('first enumerate result', transport.name, enumerateResult);

        if (!enumerateResult.success) {
            throw new Error(enumerateResult.error);
        }

        const descriptors = enumerateResult.payload;

        const waitForDevicesPromise =
            initParams.pendingTransportEvent && descriptors.length
                ? this.waitForDevices(descriptors.length, 10000)
                : Promise.resolve();

        // TODO handleDescriptorChange can emit TRANSPORT.UPDATE before TRANSPORT.START is emitted, check whether acceptable
        transport.handleDescriptorsChange(descriptors);
        transport.listen();

        await waitForDevicesPromise;

        return transport;
    }

    private waitForDevices(deviceCount: number, autoResolveMs: number) {
        const { promise, resolve, reject } = createDeferred();
        let transportStartPending = deviceCount;

        /**
         * when TRANSPORT.START_PENDING is emitted, we already know that transport is available
         * but we wait with emitting TRANSPORT.START event to the implementator until we read from devices
         * in case something wrong happens and we never finish reading from devices for whatever reason
         * implementator could get stuck waiting from TRANSPORT.START event forever. To avoid this,
         * we emit TRANSPORT.START event after autoResolveTransportEventTimeout
         */
        const autoResolveTransportEventTimeout = setTimeout(resolve, autoResolveMs);
        this.rejectPending = reject;

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
            this.rejectPending = undefined;
            clearTimeout(autoResolveTransportEventTimeout);
            this.off(DEVICE.CONNECT, onDeviceConnect);
            this.off(DEVICE.CONNECT_UNACQUIRED, onDeviceConnect);
        });
    }

    private async _createAndSaveDevice(descriptor: Descriptor, transport: Transport) {
        _log.debug('Creating Device', descriptor);
        await this.handle(descriptor, transport);
    }

    private _createUnacquiredDevice(descriptor: Descriptor, transport: Transport) {
        _log.debug('Creating Unacquired Device', descriptor);
        const device = Device.createUnacquired(transport, descriptor);
        device.once(DEVICE.ACQUIRED, () => {
            // emit connect event once device becomes acquired
            this.emit(DEVICE.CONNECT, device.toMessageObject());
        });

        return device;
    }

    private _createUnreadableDevice(
        descriptor: Descriptor,
        transport: Transport,
        unreadableError: string,
    ) {
        _log.debug('Creating Unreadable Device', descriptor, unreadableError);

        return Device.createUnacquired(transport, descriptor, unreadableError);
    }

    getDevice(path: string) {
        return this.devices[path];
    }

    asArray(): DeviceTyped[] {
        return this.allDevices().map(device => device.toMessageObject());
    }

    allDevices(): Device[] {
        return Object.keys(this.devices).map(key => this.devices[key]);
    }

    length() {
        return this.asArray().length;
    }

    transportType() {
        // return this.transport.name;
        const [transport] = this.getActiveTransports();

        return transport.name;
    }

    getTransportInfo(): TransportInfo {
        const [transport] = this.getActiveTransports();

        return {
            type: this.transportType(),
            version: transport.version,
            outdated: transport.isOutdated,
        };
    }

    dispose() {
        this.removeAllListeners();

        return this.cleanup();
    }

    async cleanup() {
        const devices = this.allDevices();

        this.authPenaltyManager.clear();
        Object.keys(this.devices).forEach(key => delete this.devices[key]);

        this.rejectPending?.(new Error('Disposed'));

        // disconnect devices
        devices.forEach(device => {
            // device.disconnect();
            this.emit(DEVICE.DISCONNECT, device.toMessageObject());
        });

        this.createDevicesQueue.forEach(dfd => dfd.resolve());
        this.createDevicesQueue = [];

        // release all devices
        await Promise.all(devices.map(device => device.dispose()));

        // now we can be relatively sure that release calls have been dispatched
        // and we can safely kill all async subscriptions in transport layer
        // transport?.stop();
        this.getActiveTransports().forEach(transport => transport.stop());
    }

    // TODO this is fugly
    async enumerate(transport: Transport = this.getActiveTransports()[0]) {
        // is this even used?
        const res = await transport.enumerate();

        if (!res.success) {
            return;
        }

        res.payload.forEach(d => {
            if (this.devices[d.path]) {
                this.devices[d.path].updateDescriptor(d);
                // TODO: is this ok? transportSession should be set only as result of acquire/release
                // this.devices[d.path].transportSession = d.session;
            }
        });
    }

    addAuthPenalty(device: Device) {
        return this.authPenaltyManager.add(device);
    }

    removeAuthPenalty(device: Device) {
        return this.authPenaltyManager.remove(device);
    }

    // main logic
    private async handle(descriptor: Descriptor, transport: Transport) {
        const path = `${transport.name}/${descriptor.path.toString()}`;
        console.warn('Handle', path, transport.name);
        try {
            // "regular" device creation
            await this._takeAndCreateDevice(descriptor, transport);
        } catch (error) {
            _log.debug('Cannot create device', error);
            if (
                error.code === 'Device_NotFound' ||
                error.message === TRANSPORT_ERROR.DEVICE_NOT_FOUND ||
                error.message === TRANSPORT_ERROR.DEVICE_DISCONNECTED_DURING_ACTION ||
                error.message === TRANSPORT_ERROR.UNEXPECTED_ERROR ||
                error.message === TRANSPORT_ERROR.DESCRIPTOR_NOT_FOUND ||
                // bridge died during device initialization
                error.message === TRANSPORT_ERROR.HTTP_ERROR
            ) {
                // do nothing
                // For example:
                // 1. connect device
                // 2. _createAndSaveDevice => handle => _takeAndCreateDevice => device.run()
                // 3. disconnect device
                // 4. some of the above mentioned errors is returned.
                delete this.devices[path];
            } else if (error.message === TRANSPORT_ERROR.SESSION_WRONG_PREVIOUS) {
                this.enumerate(transport);
                this._handleUsedElsewhere(descriptor, transport);
            } else if (
                // device was claimed by another application on transport api layer (claimInterface in usb nomenclature) but never released (releaseInterface in usb nomenclature)
                // the only remedy for this is to reconnect device manually
                // or possibly there are 2 applications without common sessions background
                error.message === TRANSPORT_ERROR.INTERFACE_UNABLE_TO_OPEN_DEVICE ||
                // catch one of trezord LIBUSB_ERRORs
                error.message?.indexOf(ERRORS.LIBUSB_ERROR_MESSAGE) >= 0 ||
                // we tried to initialize device (either automatically after enumeration or after user click)
                // but it did not work out. this device is effectively unreadable and user should do something about it
                error.code === 'Device_InitializeFailed'
            ) {
                console.warn('---> wtf here?', error.message);
                const device = this._createUnreadableDevice(
                    this.creatingDevicesDescriptors[path],
                    transport,
                    error.message,
                );
                this.devices[path] = device;
                this.emit(DEVICE.CONNECT_UNACQUIRED, device.toMessageObject());
            } else if (error.code === 'Device_UsedElsewhere') {
                // most common error - someone else took the device at the same time
                this._handleUsedElsewhere(descriptor, transport);
            } else {
                await resolveAfter(501, null).promise;
                await this.handle(descriptor, transport);
            }
        }
    }

    private async _takeAndCreateDevice(descriptor: Descriptor, transport: Transport) {
        const device = Device.fromDescriptor(transport, descriptor);
        const path = `${transport.name}/${descriptor.path.toString()}`;
        this.devices[path] = device;
        const promise = device.run();
        await promise;

        this.emit(DEVICE.CONNECT, device.toMessageObject());
    }

    private _handleUsedElsewhere(descriptor: Descriptor, transport: Transport) {
        const path = `${transport.name}/${descriptor.path.toString()}`;

        const device = this._createUnacquiredDevice(
            this.creatingDevicesDescriptors[path],
            transport,
        );
        this.devices[path] = device;
        this.emit(DEVICE.CONNECT_UNACQUIRED, device.toMessageObject());
    }
}
