// original file https://github.com/trezor/connect/blob/develop/src/js/device/DeviceList.js

import { TypedEmitter } from '@trezor/utils';
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

/**
 * when TRANSPORT.START_PENDING is emitted, we already know that transport is available
 * but we wait with emitting TRANSPORT.START event to the implementator until we read from devices
 * in case something wrong happens and we never finish reading from devices for whatever reason
 * implementator could get stuck waiting from TRANSPORT.START event forever. To avoid this,
 * we emit TRANSPORT.START event after autoResolveTransportEventTimeout
 */
let autoResolveTransportEventTimeout: ReturnType<typeof setTimeout> | undefined;

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

export class DeviceList extends TypedEmitter<DeviceListEvents> {
    // @ts-expect-error has no initializer
    private transport: Transport;

    // array of transport that might be used in this environment
    private transports: Transport[];

    private devices: { [path: string]: Device } = {};

    private creatingDevicesDescriptors: { [k: string]: Descriptor } = {};

    private transportStartPending = 0;

    private penalizedDevices: { [deviceID: string]: number } = {};

    private transportFirstEventPromise: Promise<void> | undefined;

    private priority;

    private transportCommonArgs;

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

        this.priority = priority;
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

    private onTransportUpdate(diff: DeviceDescriptorDiff) {
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

            const penalty = this.getAuthPenalty();

            if (this.priority || penalty) {
                await resolveAfter(501 + penalty + 100 * this.priority, null).promise;
            }
            if (this.creatingDevicesDescriptors[path].session == null) {
                await this._createAndSaveDevice(descriptor);
            } else {
                const device = this._createUnacquiredDevice(descriptor);
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
                    await this._createAndSaveDevice(descriptor);
                }
            }
        });

        const events = [
            {
                d: diff.changedSessions,
                e: DEVICE.CHANGED,
            },
            {
                d: diff.acquired,
                e: DEVICE.ACQUIRED,
            },
            {
                d: diff.released,
                e: DEVICE.RELEASED,
            },
        ];

        events.forEach(({ d, e }) => {
            d.forEach(descriptor => {
                const path = descriptor.path.toString();
                const device = this.devices[path];
                if (device) {
                    _log.debug('Event', e, device.toMessageObject());
                    this.emit(e, device.toMessageObject());
                }
            });
        });

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
    async init(pendingTransportEvent?: boolean) {
        try {
            _log.debug('Initializing transports');
            let lastError:
                | Extract<
                      Awaited<ReturnType<Transport['init']>['promise']>,
                      { success: false }
                  >['error']
                | undefined;

            for (const transport of this.transports) {
                this.transport = transport;
                const result = await this.transport.init().promise;
                if (result.success) {
                    lastError = undefined;
                    break;
                } else {
                    lastError = result.error;
                }
            }

            if (lastError) {
                this.emit(TRANSPORT.ERROR, lastError);

                return;
            }

            /**
             * listen to change of descriptors reported by @trezor/transport
             * we can say that this part lets connect know about
             * "external activities with trezor devices" such as device was connected/disconnected
             * or it was acquired or released by another application.
             * releasing/acquiring device by this application is not solved here but directly
             * where transport.acquire, transport.release is called
             */
            this.transport.on(TRANSPORT.UPDATE, this.onTransportUpdate.bind(this));

            // just like transport emits updates, it may also start producing errors, for example bridge process crashes.
            this.transport.on(TRANSPORT.ERROR, error => {
                this.emit(TRANSPORT.ERROR, error);
            });

            // enumerating for the first time. we intentionally postpone emitting TRANSPORT_START
            // event until we read descriptors for the first time
            const enumerateResult = await this.transport.enumerate().promise;

            if (!enumerateResult.success) {
                this.emit(TRANSPORT.ERROR, enumerateResult.error);

                return;
            }

            const descriptors = enumerateResult.payload;

            if (descriptors.length > 0 && pendingTransportEvent) {
                this.transportStartPending = descriptors.length;
                // listen for self emitted events and resolve pending transport event if needed
                this.on(DEVICE.CONNECT, this.resolveTransportEvent.bind(this));
                this.on(DEVICE.CONNECT_UNACQUIRED, this.resolveTransportEvent.bind(this));
                autoResolveTransportEventTimeout = setTimeout(() => {
                    this.emit(TRANSPORT.START, this.getTransportInfo());
                }, 10000);
            } else {
                this.emit(TRANSPORT.START, this.getTransportInfo());
            }
            this.transport.handleDescriptorsChange(descriptors);
            this.transport.listen();
        } catch (error) {
            // transport should never. lets observe it but we could even remove try catch from here
            console.error('DeviceList init error', error);
        }
    }

    private resolveTransportEvent() {
        this.transportStartPending--;
        if (autoResolveTransportEventTimeout) {
            clearTimeout(autoResolveTransportEventTimeout);
        }
        if (this.transportStartPending === 0) {
            this.emit(TRANSPORT.START, this.getTransportInfo());
        }
    }

    getTransportFirstEventPromise() {
        return this.transportFirstEventPromise;
    }

    async waitForTransportFirstEvent() {
        this.transportFirstEventPromise = new Promise<void>(resolve => {
            const handler = () => {
                this.removeListener(TRANSPORT.START, handler);
                this.removeListener(TRANSPORT.ERROR, handler);
                resolve();
            };
            this.on(TRANSPORT.START, handler);
            this.on(TRANSPORT.ERROR, handler);
        });
        await this.transportFirstEventPromise;
    }

    private async _createAndSaveDevice(descriptor: Descriptor) {
        _log.debug('Creating Device', descriptor);
        await this.handle(descriptor);
    }

    private _createUnacquiredDevice(descriptor: Descriptor) {
        _log.debug('Creating Unacquired Device', descriptor);
        const device = Device.createUnacquired(this.transport, descriptor);
        device.once(DEVICE.ACQUIRED, () => {
            // emit connect event once device becomes acquired
            this.emit(DEVICE.CONNECT, device.toMessageObject());
        });

        return device;
    }

    private _createUnreadableDevice(descriptor: Descriptor, unreadableError: string) {
        _log.debug('Creating Unreadable Device', descriptor, unreadableError);

        return Device.createUnacquired(this.transport, descriptor, unreadableError);
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

        if (autoResolveTransportEventTimeout) {
            clearTimeout(autoResolveTransportEventTimeout);
        }
        // release all devices
        Promise.all(this.allDevices().map(device => device.dispose())).then(() => {
            // now we can be relatively sure that release calls have been dispatched
            // and we can safely kill all async subscriptions in transport layer
            this.transport.stop();
        });
    }

    disconnectDevices() {
        this.allDevices().forEach(device => {
            // device.disconnect();
            this.emit(DEVICE.DISCONNECT, device.toMessageObject());
        });
    }

    async enumerate() {
        const res = await this.transport.enumerate().promise;

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
        if (!device.isInitialized() || device.isBootloader() || !device.features.device_id) return;
        const deviceID = device.features.device_id;
        const penalty = this.penalizedDevices[deviceID]
            ? this.penalizedDevices[deviceID] + 500
            : 2000;
        this.penalizedDevices[deviceID] = Math.min(penalty, 5000);
    }

    private getAuthPenalty() {
        const { penalizedDevices } = this;

        return Object.keys(penalizedDevices).reduce(
            (penalty, key) => Math.max(penalty, penalizedDevices[key]),
            0,
        );
    }

    removeAuthPenalty(device: Device) {
        if (!device.isInitialized() || device.isBootloader() || !device.features.device_id) return;
        const deviceID = device.features.device_id;
        delete this.penalizedDevices[deviceID];
    }

    // main logic
    private async handle(descriptor: Descriptor) {
        const path = descriptor.path.toString();
        try {
            // "regular" device creation
            await this._takeAndCreateDevice(descriptor);
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
                this.enumerate();
                this._handleUsedElsewhere(descriptor);
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
                    error.message,
                );
                this.devices[path] = device;
                this.emit(DEVICE.CONNECT_UNACQUIRED, device.toMessageObject());
            } else if (error.code === 'Device_UsedElsewhere') {
                // most common error - someone else took the device at the same time
                this._handleUsedElsewhere(descriptor);
            } else {
                await resolveAfter(501, null).promise;
                await this.handle(descriptor);
            }
        }
        delete this.creatingDevicesDescriptors[path];
    }

    private async _takeAndCreateDevice(descriptor: Descriptor) {
        const device = Device.fromDescriptor(this.transport, descriptor);
        const path = descriptor.path.toString();
        this.devices[path] = device;
        const promise = device.run();
        await promise;

        this.emit(DEVICE.CONNECT, device.toMessageObject());
    }

    private _handleUsedElsewhere(descriptor: Descriptor) {
        const path = descriptor.path.toString();

        const device = this._createUnacquiredDevice(this.creatingDevicesDescriptors[path]);
        this.devices[path] = device;
        this.emit(DEVICE.CONNECT_UNACQUIRED, device.toMessageObject());
    }
}
