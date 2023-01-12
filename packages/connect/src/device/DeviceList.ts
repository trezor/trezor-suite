// original file https://github.com/trezor/connect/blob/develop/src/js/device/DeviceList.js

/* eslint-disable no-restricted-syntax */

import EventEmitter from 'events';

// todo: maybe 2 utilities Transport.init.browser Transport.init.node primo v transportu
import {
    BridgeTransport,
    WebUsbTransport,
    NodeUsbTransport,
    Transport,
    TRANSPORT,
    Descriptor,
} from '@trezor/transport';
import { ERRORS } from '../constants';
import { DEVICE, TransportInfo } from '../events';
import { Device } from './Device';
import type { Device as DeviceTyped } from '../types';
import { DataManager } from '../data/DataManager';
import { getBridgeInfo } from '../data/transportInfo';
import { initLog } from '../utils/debug';
import { resolveAfter } from '../utils/promiseUtils';

// custom log
const _log = initLog('DeviceList');
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

export interface DeviceList {
    on<K extends keyof DeviceListEvents>(
        type: K,
        listener: (event: DeviceListEvents[K]) => void,
    ): this;
    off<K extends keyof DeviceListEvents>(
        type: K,
        listener: (event: DeviceListEvents[K]) => void,
    ): this;
    emit<K extends keyof DeviceListEvents>(type: K, args: DeviceListEvents[K]): boolean;
}
export class DeviceList extends EventEmitter {
    // @ts-expect-error has no initializer
    transport: Transport;

    // array of transport that might be used in this environment
    transports: Transport[] = [];

    devices: { [path: string]: Device } = {};

    creatingDevicesDescriptors: { [k: string]: Descriptor } = {};

    transportStartPending = 0;

    penalizedDevices: { [deviceID: string]: number } = {};

    constructor() {
        super();
        let { transports } = DataManager.settings;

        // we fill in `transports` with a reasonable fallback in src/index.
        // since web index is released into npm, we can not rely
        // on that that transports will be always set here. We need to provide a 'fallback of the last resort'
        if (!transports?.length) {
            transports = ['BridgeTransport', 'WebUsbTransport'];
        }

        // mapping of provided transports[] to @trezor/transport classes
        transports.forEach(transportType => {
            if (typeof transportType === 'string') {
                switch (transportType) {
                    case 'NodeUsbTransport':
                        this.transports.push(new NodeUsbTransport());
                        break;
                    case 'WebUsbTransport':
                        // todo: any idea how to configure typescript here?
                        // @ts-expect-error
                        this.transports.push(new WebUsbTransport());
                        break;
                    case 'BridgeTransport':
                        this.transports.push(
                            new BridgeTransport({
                                latestVersion: getBridgeInfo().version.join('.'),
                            }),
                        );
                        break;
                    default:
                        throw ERRORS.TypedError(
                            'Runtime',
                            `DeviceList.init: transports[] of unexpected type: ${transportType}`,
                        );
                    // not implemented
                    // case 'UdpTransport':
                }

                // todo: a better check whether abstract transport class is in prototype of provided transport object?
            } else if (typeof transportType === 'object') {
                // todo: allow transports to be either string or a class (useful for react-native)
                this.transports.unshift(transportType);
            } else {
                // runtime check
                throw ERRORS.TypedError(
                    'Runtime',
                    'DeviceList.init: transports[] of unexpected type',
                );
            }
        });
    }

    /**
     * Init @trezor/transport and do something with its results
     */
    async init() {
        console.log('DEVICE.LIST init');
        try {
            _log.debug('Initializing transports');

            let lastError: any = null;

            for (const transport of this.transports) {
                this.transport = transport;
                const result = await this.transport.init();

                if (result.success) {
                    lastError = '';
                    break;
                } else {
                    lastError = result.message;
                }
            }

            const _transportLog = initLog('@trezor/transport', true);
            // todo: move log somewhere to utils
            this.transport.setLogger(_transportLog);

            if (lastError || !this.transport) {
                throw (
                    lastError ||
                    ERRORS.TypedError(
                        'Runtime',
                        'DeviceList.init: No transport could be initialized.',
                    )
                );
            }

            /**
             * listen to change of descriptors reported by @trezor/transport
             * we can say that this part lets connect know about
             * "external activities with trezor devices" such as device was connected/disconnected
             * or it was acquired or released by another application.
             * releasing/acquiring device by this application is not solved here but directly
             * where transport.acquire, transport.release is called
             */
            this.transport.on(TRANSPORT.UPDATE, diff => {
                diff.connected.forEach(async descriptor => {
                    const path = descriptor.path.toString();
                    const priority = DataManager.getSettings('priority');
                    const penalty = this.getAuthPenalty();

                    if (priority || penalty) {
                        await resolveAfter(501 + penalty + 100 * priority, null);
                    }
                    if (descriptor.session == null) {
                        await this._createAndSaveDevice(descriptor);
                    } else {
                        const device = this._createUnacquiredDevice(descriptor);
                        this.devices[path] = device;
                        this.emit(DEVICE.CONNECT_UNACQUIRED, device.toMessageObject());
                    }
                });

                diff.acquired.forEach(descriptor => {
                    const path = descriptor.path.toString();
                    if (this.creatingDevicesDescriptors[path]) {
                        this.creatingDevicesDescriptors[path] = descriptor;
                    }
                });

                diff.acquiredElsewhere.forEach((descriptor: Descriptor) => {
                    const path = descriptor.path.toString();
                    const device = this.devices[path];

                    if (device) {
                        // device.originalDescriptor = descriptor;
                        device.interruptionFromOutside();
                    }
                });

                // todo: not sure if this part is needed.
                diff.released.forEach(descriptor => {
                    const path = descriptor.path.toString();
                    const device = this.devices[path];
                    if (device) {
                        device.keepSession = false;
                    }
                    // if (device?.commands?.disposed) {

                    // todo:?
                    // this.devices[path].originalDescriptor.session = null;

                    // todo: shouldn't this be in releasedByMyself?
                    // device.activitySessionID = null;
                    // }
                });

                diff.releasedElsewhere.forEach(async descriptor => {
                    const path = descriptor.path.toString();
                    const device = this.devices[path];
                    if (device) {
                        // if (device.commands?.disposed) {
                        // set "was used status" via featuresNeedsReload
                        // todo: maybe already in acquiredElsewhere?
                        device.featuresNeedsReload = true;
                        // }

                        if (device.isUnacquired() && !device.isInconsistent()) {
                            // wait for publish changes
                            await resolveAfter(501, null);
                            _log.debug('Create device from unacquired', device);
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
                        _log.debug('Event', e, device);
                        if (device) {
                            this.emit(e, device.toMessageObject());
                        }
                    });
                });

                diff.disconnected.forEach(descriptor => {
                    const path = descriptor.path.toString();
                    const device = this.devices[path];
                    if (device != null) {
                        device.disconnect();
                        delete this.devices[path];
                        this.emit(DEVICE.DISCONNECT, device.toMessageObject());
                    }
                });

                // todo: not sure if this is correct, it might be duplication of writes to
                // this.devices[d.path].activitySessionID in case of acquired/release by myself
                // maybe, updating of descriptors should be done only in diff.acquiredElsewhere,
                // diff.releasedElsewhere blocks

                // whenever descriptors change we need to update them so that we can use them
                // in subsequent transport.acquire calls
                diff.descriptors.forEach(d => {
                    if (this.devices[d.path]) {
                        this.devices[d.path].originalDescriptor = {
                            session: d.session,
                            path: d.path,
                        };
                        // todo: not sure about updating activitySessionID, imho this should
                        // be done only after acquire/release
                        this.devices[d.path].activitySessionID = d.session;
                    }
                });
            });

            // just like transport emits updates, it may also start producing errors, for example bridge
            // process crashes.
            this.transport.on(TRANSPORT.ERROR, error => {
                this.emit(TRANSPORT.ERROR, error);
            });

            // listen for self emitted events and resolve pending transport event if needed
            this.on(DEVICE.CONNECT, this.resolveTransportEvent.bind(this));
            this.on(DEVICE.CONNECT_UNACQUIRED, this.resolveTransportEvent.bind(this));

            console.log('DEVICE.LIST, enumerate');
            // enumerating for the first time. we intentionally postpone emitting TRANSPORT_START
            // event until we read descriptors for the first time
            const descriptors = await this.transport.enumerate();

            console.log('DEVICE.LIST, enumerate done', descriptors);

            if (descriptors.length > 0 && DataManager.getSettings('pendingTransportEvent')) {
                console.log('DEVICE.LIST START PENDING!');
                this.transportStartPending = descriptors.length;
            } else {
                this.emit(TRANSPORT.START, this.getTransportInfo());
            }
            this.transport.handleDescriptorsChange(descriptors);
            this.transport.listen();
        } catch (error) {
            // todo: transport probably never throws. or should never throw?
            this.emit(TRANSPORT.ERROR, error);
        }
    }

    private resolveTransportEvent() {
        console.log('DEVICE.LIST resolve transport event', this.transportStartPending);
        this.transportStartPending--;

        if (this.transportStartPending === 0) {
            this.emit(TRANSPORT.START, this.getTransportInfo());
        }

        // this should never happen (race condition), just in case, add a console.error for sentry
        if (this.transportStartPending < 0) {
            console.error('DeviceList: transportStartPending < 0');
        }
    }

    waitForTransportFirstEvent() {
        return new Promise<void>(resolve => {
            const handler = () => {
                this.removeListener(TRANSPORT.START, handler);
                this.removeListener(TRANSPORT.ERROR, handler);
                resolve();
            };
            this.on(TRANSPORT.START, handler);
            this.on(TRANSPORT.ERROR, handler);
        });
    }

    private async _createAndSaveDevice(descriptor: Descriptor) {
        _log.debug('Creating Device', descriptor);
        console.log('_createAndSaveDevice CreateDeviceHandler.handle() waiting');
        await this.handle(descriptor);
        console.log('_createAndSaveDevice CreateDeviceHandler.handle() done');
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

    async dispose() {
        this.removeAllListeners();

        // release all devices
        await Promise.all(this.allDevices().map(device => device.dispose()));

        // now we can be relatively sure that release calls have been dispatched
        // and we can safely kill all async subscriptions in transport layer
        if (this.transport) {
            this.transport.stop();
        }
    }

    disconnectDevices() {
        this.allDevices().forEach(device => {
            // device.disconnect();
            this.emit(DEVICE.DISCONNECT, device.toMessageObject());
        });
    }

    async enumerate() {
        console.log('deviceList.enumerate');

        const res = await this.transport.enumerate();
        res.forEach(d => {
            if (this.devices[d.path]) {
                this.devices[d.path].originalDescriptor = {
                    session: d.session,
                    path: d.path,
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
        // creatingDevicesDescriptors is needed, so that if *during* creating of Device,
        // other application acquires the device and changes the descriptor,
        // the new unacquired device has correct descriptor
        const path = descriptor.path.toString();
        this.creatingDevicesDescriptors[path] = descriptor;

        try {
            // "regular" device creation
            console.log('this._takeAndCreateDevice()');
            await this._takeAndCreateDevice(descriptor);
            console.log('this._takeAndCreateDevice() done');
        } catch (error) {
            console.log('handle:error:code', error.code);
            console.log('handle:error:message', error.message);

            _log.debug('Cannot create device', error);

            if (error.code === 'Device_NotFound') {
                // do nothing
                // it's a race condition between "device_changed" and "device_disconnected"
            } else if (
                error.message === ERRORS.WRONG_PREVIOUS_SESSION_ERROR_MESSAGE ||
                error?.message?.includes('Unable to claim interface')
            ) {
                this.enumerate();
                this._handleUsedElsewhere(descriptor);
            } else if (error.message?.indexOf(ERRORS.LIBUSB_ERROR_MESSAGE) >= 0) {
                // catch one of trezord LIBUSB_ERRORs
                const device = this._createUnreadableDevice(
                    this.creatingDevicesDescriptors[path],
                    error.message,
                );
                this.devices[path] = device;
                this.emit(DEVICE.CONNECT_UNACQUIRED, device.toMessageObject());
            } else if (error.code === 'Device_InitializeFailed') {
                // firmware bug - device is in "show address" state which cannot be cancelled
                this._handleUsedElsewhere(descriptor);
            } else if (error.code === 'Device_UsedElsewhere') {
                // most common error - someone else took the device at the same time
                this._handleUsedElsewhere(descriptor);
            } else {
                await resolveAfter(501, null);
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
