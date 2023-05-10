// original file https://github.com/trezor/connect/blob/develop/src/js/device/DeviceList.js

/* eslint-disable max-classes-per-file, @typescript-eslint/no-use-before-define */

import { TypedEmitter } from '@trezor/utils/lib/typedEventEmitter';
import TrezorLink, {
    Transport,
    TrezorDeviceInfoWithSession as DeviceDescriptor,
} from '@trezor/transport';
import fetch from 'cross-fetch';
import { ERRORS } from '../constants';
import { TRANSPORT, DEVICE, TransportInfo } from '../events';
import { DescriptorStream, DeviceDescriptorDiff } from './DescriptorStream';
import { Device } from './Device';
import type { Device as DeviceTyped } from '../types';
import { DataManager } from '../data/DataManager';
import { getBridgeInfo } from '../data/transportInfo';
import { initLog } from '../utils/debug';
import { resolveAfter } from '../utils/promiseUtils';

import { WebUsbPlugin, ReactNativeUsbPlugin } from '../workers/workers';

const { BridgeV2, Fallback } = TrezorLink;

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

// TODO: plugins are not typed in 'trezor-link'
type LowLevelPlugin = {
    name: 'WebUsbPlugin' | 'ReactNativePlugin';
    unreadableHidDeviceChange: {
        on: (event: string, fn: any) => void;
    };
    unreadableHidDevice: boolean; // not sure
};

interface DeviceListEvents {
    [TRANSPORT.START]: TransportInfo;
    [TRANSPORT.ERROR]: string;
    [TRANSPORT.STREAM]: DescriptorStream;
    [DEVICE.CONNECT]: DeviceTyped;
    [DEVICE.CONNECT_UNACQUIRED]: DeviceTyped;
    [DEVICE.DISCONNECT]: DeviceTyped;
    [DEVICE.CHANGED]: DeviceTyped;
    [DEVICE.RELEASED]: DeviceTyped;
    [DEVICE.ACQUIRED]: DeviceTyped;
}

export class DeviceList extends TypedEmitter<DeviceListEvents> {
    transport: Transport;

    transportPlugin: LowLevelPlugin | typeof undefined;

    // @ts-expect-error: strictPropertyInitialization
    stream: DescriptorStream;

    devices: { [path: string]: Device } = {};

    creatingDevicesDescriptors: { [k: string]: DeviceDescriptor } = {};

    messages: JSON | Record<string, any>;

    transportStartPending = 0;

    penalizedDevices: { [deviceID: string]: number } = {};

    fetchController?: AbortController | null;

    constructor() {
        super();

        const env = DataManager.getSettings('env');
        let transportSettings = DataManager.getSettings('transports');

        const transports: Transport[] = [];

        // fallback of "the last instance".
        // since web index (that otherwise set fallbacks) is released into npm, we can not rely
        // on that that transports will be always set here. We need to provide a 'fallback of the last resort'
        if (!transportSettings?.length) {
            transportSettings = ['BridgeTransport'];
        }

        if (env === 'react-native' && typeof ReactNativeUsbPlugin !== 'undefined') {
            transports.push(ReactNativeUsbPlugin());
        } else if (transportSettings?.includes('BridgeTransport')) {
            const bridgeLatestVersion = getBridgeInfo().version.join('.');
            const bridge = new BridgeV2(undefined, undefined);
            bridge.setBridgeLatestVersion(bridgeLatestVersion);

            this.fetchController = new AbortController();
            const { signal } = this.fetchController;
            // @ts-expect-error TODO: https://github.com/trezor/trezor-suite/issues/5332
            const fetchWithSignal = (args, options = {}) => fetch(args, { ...options, signal });

            // detection of environment browser/node
            // todo: code should not be detecting environment itself. imho it should be built with this information passed from build process maybe?
            const isNode =
                !!process?.release?.name && process.release.name.search(/node|io\.js/) !== -1;
            BridgeV2.setFetch(fetchWithSignal, isNode);
            // @ts-expect-error TODO: https://github.com/trezor/trezor-suite/issues/5332
            transports.push(bridge);
        }

        if (transportSettings?.includes('WebUsbTransport') && typeof WebUsbPlugin !== 'undefined') {
            transports.push(WebUsbPlugin());
        }

        this.transport = new Fallback(transports);
        this.messages = DataManager.getProtobufMessages();
    }

    async init() {
        const { transport } = this;
        try {
            _log.debug('Initializing transports');
            await transport.init(_log.enabled);
            _log.debug('Configuring transports');
            await transport.configure(JSON.stringify(this.messages));
            _log.debug('Configuring transports done');

            const { activeName } = transport;
            if (activeName === 'WebUsbTransport') {
                // @ts-expect-error TODO: https://github.com/trezor/trezor-suite/issues/5332
                this.transportPlugin = transport.activeTransport.plugin;
            }

            await this._initStream();

            // listen for self emitted events and resolve pending transport event if needed
            this.on(DEVICE.CONNECT, this.resolveTransportEvent.bind(this));
            this.on(DEVICE.CONNECT_UNACQUIRED, this.resolveTransportEvent.bind(this));
        } catch (error) {
            this.emit(TRANSPORT.ERROR, error);
        }
    }

    resolveTransportEvent() {
        this.transportStartPending--;
        if (this.transportStartPending === 0) {
            this.stream.emit(TRANSPORT.START);
        }
    }

    async waitForTransportFirstEvent() {
        await new Promise<void>(resolve => {
            const handler = () => {
                this.removeListener(TRANSPORT.START, handler);
                this.removeListener(TRANSPORT.ERROR, handler);
                resolve();
            };
            this.on(TRANSPORT.START, handler);
            this.on(TRANSPORT.ERROR, handler);
        });
    }

    /**
     * Transport events handler
     * @param {Transport} transport
     * @memberof DeviceList
     */
    _initStream() {
        const stream = new DescriptorStream(this.transport);

        stream.on(TRANSPORT.START_PENDING, (pending: number) => {
            this.transportStartPending = pending;
            autoResolveTransportEventTimeout = setTimeout(() => {
                this.resolveTransportEvent();
            }, 5000);
        });

        stream.on(TRANSPORT.START, () => {
            this.emit(TRANSPORT.START, this.getTransportInfo());
            if (autoResolveTransportEventTimeout) {
                clearTimeout(autoResolveTransportEventTimeout);
            }
        });

        stream.on(TRANSPORT.UPDATE, (diff: DeviceDescriptorDiff) => {
            new DiffHandler(this, diff).handle();
        });

        stream.on(TRANSPORT.ERROR, error => {
            this.emit(TRANSPORT.ERROR, error);
            stream.stop();
        });

        stream.listen();
        this.stream = stream;

        if (this.transportPlugin && this.transportPlugin.name === 'WebUsbPlugin') {
            const { unreadableHidDeviceChange } = this.transportPlugin;
            // TODO: https://github.com/trezor/trezor-link/issues/40
            const UNREADABLE_PATH = 'unreadable'; // unreadable device doesn't return incremental path.
            unreadableHidDeviceChange.on('change', () => {
                if (this.transportPlugin && this.transportPlugin.unreadableHidDevice) {
                    const device = this._createUnreadableDevice(
                        {
                            path: UNREADABLE_PATH,
                            session: null,
                            debugSession: null,
                            debug: false,
                        },
                        'HID_DEVICE',
                    );
                    this.devices[UNREADABLE_PATH] = device;
                    this.emit(DEVICE.CONNECT_UNACQUIRED, device.toMessageObject());
                } else {
                    const device = this.devices[UNREADABLE_PATH];
                    delete this.devices[UNREADABLE_PATH];
                    this.emit(DEVICE.DISCONNECT, device.toMessageObject());
                }
            });
        }

        this.emit(TRANSPORT.STREAM, stream);
    }

    async _createAndSaveDevice(descriptor: DeviceDescriptor) {
        _log.debug('Creating Device', descriptor);
        await new CreateDeviceHandler(descriptor, this).handle();
    }

    _createUnacquiredDevice(descriptor: DeviceDescriptor) {
        _log.debug('Creating Unacquired Device', descriptor);
        const device = Device.createUnacquired(this.transport, descriptor);
        device.once(DEVICE.ACQUIRED, () => {
            // emit connect event once device becomes acquired
            this.emit(DEVICE.CONNECT, device.toMessageObject());
        });
        return device;
    }

    _createUnreadableDevice(descriptor: DeviceDescriptor, unreadableError: string) {
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
        const { transport } = this;
        const { activeName } = transport;
        // 'UnknownTransport' should never happen, only for ts, will change in
        // https://github.com/trezor/trezor-suite/pull/6509/
        return activeName || 'UnknownTransport';
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

        if (this.stream) {
            this.stream.stop();
        }

        if (autoResolveTransportEventTimeout) {
            clearTimeout(autoResolveTransportEventTimeout);
        }
        // release all devices
        await Promise.all(this.allDevices().map(device => device.dispose()));

        // now we can be relatively sure that release calls have been dispatched
        // and we can safely kill all async subscriptions in transport layer
        if (this.transport) {
            this.transport.stop();
        }
        if (this.fetchController) {
            this.fetchController.abort();
            this.fetchController = null;
        }
    }

    disconnectDevices() {
        this.allDevices().forEach(device => {
            // device.disconnect();
            this.emit(DEVICE.DISCONNECT, device.toMessageObject());
        });
    }

    enumerate() {
        this.stream.enumerate();
        if (!this.stream.current) return;
        // update current values
        this.stream.current.forEach(descriptor => {
            const path = descriptor.path.toString();
            const device = this.devices[path];
            if (device) {
                device.updateDescriptor(descriptor);
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

    getAuthPenalty() {
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
}

/**
 * DeviceList initialization
 * returns instance of DeviceList
 * @returns {Promise<DeviceList>}
 */
export const getDeviceList = async () => {
    const list = new DeviceList();
    await list.init();
    return list;
};

// Helper class for creating new device
class CreateDeviceHandler {
    descriptor: DeviceDescriptor;

    list: DeviceList;

    path: string;

    constructor(descriptor: DeviceDescriptor, list: DeviceList) {
        this.descriptor = descriptor;
        this.list = list;
        this.path = descriptor.path.toString();
    }

    // main logic
    async handle() {
        // creatingDevicesDescriptors is needed, so that if *during* creating of Device,
        // other application acquires the device and changes the descriptor,
        // the new unacquired device has correct descriptor
        this.list.creatingDevicesDescriptors[this.path] = this.descriptor;

        try {
            // "regular" device creation
            await this._takeAndCreateDevice();
        } catch (error) {
            _log.debug('Cannot create device', error);

            if (error.code === 'Device_NotFound' || error.message === 'device not found') {
                // do nothing
                // it's a race condition between "device_changed" and "device_disconnected"
            } else if (
                error.message === ERRORS.WRONG_PREVIOUS_SESSION_ERROR_MESSAGE ||
                error.toString() === ERRORS.WEBUSB_ERROR_MESSAGE
            ) {
                this.list.enumerate();
                this._handleUsedElsewhere();
            } else if (error.message?.indexOf(ERRORS.LIBUSB_ERROR_MESSAGE) >= 0) {
                // catch one of trezord LIBUSB_ERRORs
                const device = this.list._createUnreadableDevice(
                    this.list.creatingDevicesDescriptors[this.path],
                    error.message,
                );
                this.list.devices[this.path] = device;
                this.list.emit(DEVICE.CONNECT_UNACQUIRED, device.toMessageObject());
            } else if (error.code === 'Device_InitializeFailed') {
                // firmware bug - device is in "show address" state which cannot be cancelled
                this._handleUsedElsewhere();
            } else if (error.code === 'Device_UsedElsewhere') {
                // most common error - someone else took the device at the same time
                this._handleUsedElsewhere();
            } else {
                await resolveAfter(501, null).promise;
                await this.handle();
            }
        }
        delete this.list.creatingDevicesDescriptors[this.path];
    }

    async _takeAndCreateDevice() {
        const device = Device.fromDescriptor(this.list.transport, this.descriptor);
        this.list.devices[this.path] = device;
        await device.run();
        this.list.emit(DEVICE.CONNECT, device.toMessageObject());
    }

    _handleUsedElsewhere() {
        const device = this.list._createUnacquiredDevice(
            this.list.creatingDevicesDescriptors[this.path],
        );
        this.list.devices[this.path] = device;
        this.list.emit(DEVICE.CONNECT_UNACQUIRED, device.toMessageObject());
    }
}

// Helper class for actual logic of handling differences
class DiffHandler {
    list: DeviceList;

    diff: DeviceDescriptorDiff;

    constructor(list: DeviceList, diff: DeviceDescriptorDiff) {
        this.list = list;
        this.diff = diff;
    }

    handle() {
        _log.debug('Update DescriptorStream', this.diff);

        // note - this intentionally does not wait for connected devices
        // createDevice inside waits for the updateDescriptor event
        this._createConnectedDevices();
        this._createReleasedDevices();
        this._signalAcquiredDevices();

        this._updateDescriptors();
        this._emitEvents();
        this._disconnectDevices();
    }

    _updateDescriptors() {
        this.diff.descriptors.forEach((descriptor: DeviceDescriptor) => {
            const path = descriptor.path.toString();
            const device = this.list.devices[path];
            if (device) {
                device.updateDescriptor(descriptor);
            }
        });
    }

    _emitEvents() {
        const events = [
            {
                d: this.diff.changedSessions,
                e: DEVICE.CHANGED,
            },
            {
                d: this.diff.acquired,
                e: DEVICE.ACQUIRED,
            },
            {
                d: this.diff.released,
                e: DEVICE.RELEASED,
            },
        ];

        events.forEach(({ d, e }) => {
            d.forEach(descriptor => {
                const path = descriptor.path.toString();
                const device = this.list.devices[path];
                _log.debug('Event', e, device);
                if (device) {
                    this.list.emit(e, device.toMessageObject());
                }
            });
        });
    }

    // tries to read info about connected devices
    _createConnectedDevices() {
        this.diff.connected.forEach(async descriptor => {
            const path = descriptor.path.toString();
            const priority = DataManager.getSettings('priority');
            const penalty = this.list.getAuthPenalty();
            _log.debug('Connected', priority, penalty, descriptor.session, this.list.devices);
            if (priority || penalty) {
                await resolveAfter(501 + penalty + 100 * priority, null).promise;
            }
            if (descriptor.session == null) {
                await this.list._createAndSaveDevice(descriptor);
            } else {
                const device = await this.list._createUnacquiredDevice(descriptor);
                this.list.devices[path] = device;
                this.list.emit(DEVICE.CONNECT_UNACQUIRED, device.toMessageObject());
            }
        });
    }

    _signalAcquiredDevices() {
        this.diff.acquired.forEach(descriptor => {
            const path = descriptor.path.toString();
            if (this.list.creatingDevicesDescriptors[path]) {
                this.list.creatingDevicesDescriptors[path] = descriptor;
            }
        });
    }

    // tries acquire and read info about recently released devices
    _createReleasedDevices() {
        this.diff.released.forEach(async descriptor => {
            const path = descriptor.path.toString();
            const device = this.list.devices[path];
            if (device) {
                if (device.isUnacquired() && !device.isInconsistent()) {
                    // wait for publish changes
                    await resolveAfter(501, null).promise;
                    _log.debug('Create device from unacquired', device);
                    await this.list._createAndSaveDevice(descriptor);
                }
            }
        });
    }

    _disconnectDevices() {
        this.diff.disconnected.forEach(descriptor => {
            const path = descriptor.path.toString();
            const device = this.list.devices[path];
            if (device != null) {
                device.disconnect();
                delete this.list.devices[path];
                this.list.emit(DEVICE.DISCONNECT, device.toMessageObject());
            }
        });
    }
}
