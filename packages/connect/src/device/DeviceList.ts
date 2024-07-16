// original file https://github.com/trezor/connect/blob/develop/src/js/device/DeviceList.js

import { TypedEmitter, createDeferred } from '@trezor/utils';
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
    assertConnected(): asserts this is DeviceList;
    pendingConnection(): Promise<void> | undefined;
    setTransports: DeviceList['setTransports'];
    addAuthPenalty: DeviceList['addAuthPenalty'];
    removeAuthPenalty: DeviceList['removeAuthPenalty'];
    on: DeviceList['on'];
    once: DeviceList['once'];
    init: DeviceList['init'];
    dispose: DeviceList['dispose'];
}

export class DeviceList extends TypedEmitter<DeviceListEvents> implements IDeviceList {
    // @ts-expect-error has no initializer
    private transport: Transport;

    // array of transport that might be used in this environment
    private transports: Transport[];

    private devices: { [path: string]: Device } = {};

    private creatingDevicesDescriptors: { [k: string]: Descriptor } = {};

    private readonly authPenaltyManager;

    private initPromise: Promise<void> | undefined;

    private rejectWaitForDevices?: (e: Error) => void;

    private transportCommonArgs;

    isConnected(): this is DeviceList {
        return !!this.transport;
    }

    assertConnected(): asserts this is DeviceList {
        if (!this.transport) throw ERRORS.TypedError('Transport_Missing');
    }

    pendingConnection() {
        return this.initPromise;
    }

    constructor({
        messages,
        priority,
        debug,
    }: {
        messages: Record<string, any>;
        priority: number;
        debug?: boolean;
    }) {
        super();

        const transportLogger = initLog('@trezor/transport', debug);

        // todo: this should be passed from above
        const abortController = new AbortController();

        this.authPenaltyManager = createAuthPenaltyManager(priority);
        this.transportCommonArgs = {
            messages,
            logger: transportLogger,
            signal: abortController.signal,
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
        diff.disconnected.forEach(descriptor => {
            const path = descriptor.path.toString();
            const device = this.devices[path];
            if (device) {
                device.disconnect();
                delete this.devices[path];
                this.emit(DEVICE.DISCONNECT, device.toMessageObject());
            }
        });

        diff.connected.forEach(async descriptor => {
            // creatingDevicesDescriptors is needed, so that if *during* creating of Device,
            // other application acquires the device and changes the descriptor,
            // the new unacquired device has correct descriptor
            const path = descriptor.path.toString();
            this.creatingDevicesDescriptors[path] = descriptor;

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
        });

        diff.acquiredElsewhere.forEach((descriptor: Descriptor) => {
            const path = descriptor.path.toString();
            const device = this.devices[path];

            if (device) {
                device.featuresNeedsReload = true;
                device.interruptionFromOutside();
            }
        });

        diff.released.forEach(descriptor => {
            const path = descriptor.path.toString();
            const device = this.devices[path];
            const methodStillRunning = !device?.commands?.isDisposed();

            if (device && methodStillRunning) {
                device.keepSession = false;
            }
        });

        diff.releasedElsewhere.forEach(async descriptor => {
            const path = descriptor.path.toString();
            const device = this.devices[path];
            await resolveAfter(1000, null).promise;

            if (device) {
                // after device was released in another window wait for a while (the other window might
                // have the intention of acquiring it again)
                // and if the device is still reelased and has never been acquired before, acquire it here.
                if (!device.isUsed() && device.isUnacquired() && !device.isInconsistent()) {
                    _log.debug('Create device from unacquired', device.toMessageObject());
                    await this._createAndSaveDevice(descriptor, transport);
                }
            }
        });

        const forEachDescriptor = (d: Descriptor[], e: keyof DeviceListEvents) => {
            d.forEach(descriptor => {
                const path = descriptor.path.toString();
                const device = this.devices[path];
                if (device) {
                    _log.debug('Event', e, device.toMessageObject());
                    this.emit(e, device.toMessageObject());
                }
            });
        };

        forEachDescriptor(diff.changedSessions, DEVICE.CHANGED);
        forEachDescriptor(diff.acquired, DEVICE.ACQUIRED);
        forEachDescriptor(diff.released, DEVICE.RELEASED);

        // whenever descriptors change we need to update them so that we can use them
        // in subsequent transport.acquire calls
        diff.descriptors.forEach(d => {
            this.creatingDevicesDescriptors[d.path] = d;
            if (this.devices[d.path]) {
                this.devices[d.path].originalDescriptor = {
                    session: d.session,
                    path: d.path,
                    product: d.product,
                    type: d.type,
                };
            }
        });
    }

    /**
     * Init @trezor/transport and do something with its results
     */
    init(pendingTransportEvent?: boolean) {
        if (!this.initPromise) {
            _log.debug('Initializing transports');

            this.initPromise = this.selectTransport(this.transports)
                .then(transport => this.initializeTransport(transport, pendingTransportEvent))
                .then(transport => {
                    this.transport = transport;
                    this.emit(TRANSPORT.START, this.getTransportInfo());
                })
                .catch(error => {
                    this.cleanup();
                    this.emit(TRANSPORT.ERROR, error);
                })
                .finally(() => {
                    this.initPromise = undefined;
                });
        }

        return this.initPromise;
    }

    private async selectTransport([transport, ...rest]: Transport[]): Promise<Transport> {
        const result = await transport.init().promise;
        if (result.success) return transport;
        else if (rest.length) return this.selectTransport(rest);
        else throw new Error(result.error);
    }

    private async initializeTransport(transport: Transport, pendingTransportEvent?: boolean) {
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
        });

        // enumerating for the first time. we intentionally postpone emitting TRANSPORT_START
        // event until we read descriptors for the first time
        const enumerateResult = await transport.enumerate().promise;

        if (!enumerateResult.success) {
            throw new Error(enumerateResult.error);
        }

        const descriptors = enumerateResult.payload;

        // TODO handleDescriptorChange can emit TRANSPORT.UPDATE before TRANSPORT.START is emitted, check whether acceptable
        transport.handleDescriptorsChange(descriptors);
        transport.listen();

        if (descriptors.length > 0 && pendingTransportEvent) {
            await this.waitForDevices(descriptors.length, 10000);
        }

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
        this.rejectWaitForDevices = reject;

        const onDeviceConnect = () => {
            transportStartPending--;
            clearTimeout(autoResolveTransportEventTimeout);
            if (transportStartPending === 0) {
                resolve();
            }
        };

        // listen for self emitted events and resolve pending transport event if needed
        this.on(DEVICE.CONNECT, onDeviceConnect);
        this.on(DEVICE.CONNECT_UNACQUIRED, onDeviceConnect);

        return promise.finally(() => {
            this.rejectWaitForDevices = undefined;
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

    getFirstDevicePath() {
        return this.asArray()[0].path;
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

        return this.cleanup();
    }

    async cleanup() {
        const { transport } = this;
        const devices = this.allDevices();

        // @ts-expect-error will be fixed later
        this.transport = undefined;
        this.authPenaltyManager.clear();
        Object.keys(this.devices).forEach(key => delete this.devices[key]);

        this.rejectWaitForDevices?.(new Error('Disposed'));

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
        const res = await transport.enumerate().promise;

        if (!res.success) {
            return;
        }

        res.payload.forEach(d => {
            if (this.devices[d.path]) {
                this.devices[d.path].originalDescriptor = {
                    session: d.session,
                    path: d.path,
                    product: d.product,
                    type: d.type,
                };
                this.devices[d.path].activitySessionID = d.session;
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
        const path = descriptor.path.toString();
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
        delete this.creatingDevicesDescriptors[path];
    }

    private async _takeAndCreateDevice(descriptor: Descriptor, transport: Transport) {
        const device = Device.fromDescriptor(transport, descriptor);
        const path = descriptor.path.toString();
        this.devices[path] = device;
        const promise = device.run();
        await promise;

        this.emit(DEVICE.CONNECT, device.toMessageObject());
    }

    private _handleUsedElsewhere(descriptor: Descriptor, transport: Transport) {
        const path = descriptor.path.toString();

        const device = this._createUnacquiredDevice(
            this.creatingDevicesDescriptors[path],
            transport,
        );
        this.devices[path] = device;
        this.emit(DEVICE.CONNECT_UNACQUIRED, device.toMessageObject());
    }
}
