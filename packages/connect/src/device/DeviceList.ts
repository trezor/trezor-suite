// original file https://github.com/trezor/connect/blob/develop/src/js/device/DeviceList.js

import { DEVICE, asDeviceUniquePath } from '@trezor/connect-common';
import type {
    ConnectSettings,
    DecodedTrezorPushNotification,
    DeviceUniquePath,
    StaticSessionId,
    TransportError,
    TransportInfo,
} from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import { initLog } from '@trezor/connect-common/src/utils/debug';
import {
    type Descriptor,
    TRANSPORT,
    type Transport,
    type ApiType as TransportApiType,
} from '@trezor/transport-abstract';
import {
    TypedEmitter,
    arrayDistinct,
    createDeferred,
    getSynchronize,
    isNotUndefined,
    resolveAfter,
    typedObjectKeys,
} from '@trezor/utils';

import { Device } from './Device';
import { createTransportList } from './TransportList';
import { TransportManager } from './TransportManager';
import { trezorPushNotificationHandler } from './workflow/trezorPushNotification';

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

type ConstructorParams = Pick<ConnectSettings, 'priority' | 'debug' | 'manifest'>;
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

    constructor({ priority, debug, manifest }: ConstructorParams) {
        super();

        const transportLogger = initLog('@trezor/transport', debug);

        this.handshakeLock = getSynchronize();
        this.authPenaltyManager = createAuthPenaltyManager(priority);
        this.updateTransports = createTransportList({
            logger: transportLogger,
            id: manifest?.appName || manifest?.appUrl || 'unknown app',
        });
    }

    private getSimilarDevices(device: Device) {
        return this.devices.filter(d => {
            // ignore devices from the same transport
            if (d.descriptor.apiType === device.transport.apiType) {
                return false;
            }
            // in firmware mode usb.serialNumber === Features.device_id
            // in bootloader mode usb.serialNumber is unknown (string of zeroes)
            if (device.descriptor.id && d.features?.device_id === device.descriptor.id) {
                return true;
            }
            if (device.descriptor.model && d.descriptor.model === device.descriptor.model) {
                return true;
            }

            return false;
        });
    }

    private async onDeviceConnected(descriptor: Descriptor, transport: Transport) {
        const id = (this.deviceCounter++).toString(16).slice(-8);
        const device = new Device({ id: asDeviceUniquePath(id), transport, descriptor });

        const similarUsedDevices = this.getSimilarDevices(device).some(
            d => d.isUsed() || d.getBusy() === 'rebooting',
        );
        if (!similarUsedDevices) {
            const penalty = this.authPenaltyManager.get();
            const stillConnected = await this.handshakeLock(() =>
                resolveAfter(penalty && penalty + 501).then(() => device.handshake()),
            );

            if (!stillConnected) {
                return;
            }
        }

        if (descriptor.id && descriptor.apiType === 'bluetooth') {
            transport.subscribe({
                path: device.descriptor.id,
                channels: ['battery-level', 'trezor-push-notification'],
            });
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

    private onPushNotification(event: { id: string; data: number[] }) {
        const device = this.devices.find(d => d.descriptor.id === event.id);
        if (device) {
            trezorPushNotificationHandler({ device, message: event.data });
        }
    }

    private onBatteryLevel(event: { id: string; data: number[] }) {
        const device = this.devices.find(d => d.descriptor.id === event.id);
        device?.updateFeature('soc', event.data[0]);
    }

    private getOrCreateTransportManager(apiType: TransportApiType) {
        if (!this.transportManagers[apiType]) {
            const manager = new TransportManager(this.initializeTransport.bind(this));
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
        transport.on(TRANSPORT.TREZOR_PUSH_NOTIFICATION, this.onPushNotification.bind(this));
        transport.on(TRANSPORT.BATTERY_LEVEL, this.onBatteryLevel.bind(this));

        // enumerating for the first time. we intentionally postpone emitting TRANSPORT_START
        // event until we read descriptors for the first time
        const enumerateResult = await transport.enumerate({ signal });

        if (!enumerateResult.success) {
            throw new Error(enumerateResult.error.message || enumerateResult.error.code);
        }

        const descriptors = enumerateResult.payload;

        transport.handleDescriptorsChange(descriptors);
        transport.listen();

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

    getOnlyDevice(apiType?: Descriptor['apiType']): Device | undefined {
        const devices = apiType
            ? this.devices.filter(d => d.descriptor.apiType === apiType)
            : this.devices;

        return devices.length === 1 ? devices[0] : undefined;
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

        const promises = Object.values(this.transportManagers).map(manager => manager.dispose());

        await Promise.all(promises);
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
