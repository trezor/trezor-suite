import {
    AbstractApi,
    type AbstractApiArgs,
    type AbstractApiAwaitedResult,
    type AbstractApiConstructorParams,
    DEVICE_TYPE,
    type DescriptorApiLevel,
    TRANSPORT_ERROR as ERRORS,
    type PathInternal,
    error,
    success,
} from '@trezor/transport-common';

import { isHidPath } from './hid';

type CompositeApiParams = Omit<AbstractApiConstructorParams, 'type'> & {
    usbApi: AbstractApi;
    /** Called at most once, when the HID backend is enabled. May throw. */
    createHidApi: () => AbstractApi;
};

/**
 * Serves all devices through the USB api and, once enabled, HID-only Trezor One devices
 * (534c:0001) through the HID api. The USB api never opens such a device: libusb cannot claim
 * a HID interface on macOS and Windows.
 */
export class CompositeApi extends AbstractApi {
    chunkSize: number;

    private readonly usbApi: AbstractApi;
    private readonly createHidApi: () => AbstractApi;
    private hidApi?: AbstractApi;
    private hidActivation?: Promise<boolean>;
    private usbDescriptors: DescriptorApiLevel[] = [];
    private hidDescriptors: DescriptorApiLevel[] = [];

    constructor({ logger, usbApi, createHidApi }: CompositeApiParams) {
        super({ logger, type: usbApi.type });
        this.chunkSize = usbApi.chunkSize;
        this.usbApi = usbApi;
        this.createHidApi = createHidApi;

        usbApi.on('transport-interface-change', descriptors => {
            this.usbDescriptors = descriptors;
            this.emitDescriptors();
        });
    }

    /**
     * Loads the HID backend. It is not loaded at startup so that a broken native addon cannot
     * affect users who never need it. Success is final, a failed attempt is repeated by the
     * next call.
     */
    public enableHid() {
        this.hidActivation ??= this.activateHid().then(isEnabled => {
            if (!isEnabled) {
                this.hidActivation = undefined;
            }

            return isEnabled;
        });

        return this.hidActivation;
    }

    private async activateHid() {
        try {
            const hidApi = this.createHidApi();
            // The node-hid library loads its native binding on first use, so only a finished
            // enumeration proves that the backend works.
            const enumeration = await hidApi.enumerate();
            if (!enumeration.success) {
                hidApi.dispose();
                this.logger?.error('composite: hid api is not available');

                return false;
            }

            this.hidApi = hidApi;
            this.hidDescriptors = enumeration.payload;
            hidApi.on('transport-interface-change', descriptors => {
                this.hidDescriptors = descriptors;
                this.emitDescriptors();
            });
            if (this.listening) {
                hidApi.listen();
            }
            this.emitDescriptors();

            return true;
        } catch {
            this.logger?.error('composite: hid api failed to load');

            return false;
        }
    }

    // Each child reports only its own devices, while the sessions module treats every reported
    // list as complete and drops the devices missing from it.
    private getDescriptors() {
        // The HID api lists the same physical device that libusb reports as an unreadable one.
        const usbDescriptors = this.hidApi
            ? this.usbDescriptors.filter(descriptor => descriptor.type !== DEVICE_TYPE.TypeT1Hid)
            : this.usbDescriptors;

        return [...usbDescriptors, ...this.hidDescriptors];
    }

    private emitDescriptors() {
        if (this.listening) {
            this.emit('transport-interface-change', this.getDescriptors());
        }
    }

    public listen() {
        if (this.listening) return;
        this.listening = true;
        this.usbApi.listen();
        this.hidApi?.listen();
    }

    public async enumerate(...[signal]: AbstractApiArgs<'enumerate'>) {
        const [usbResult, hidResult] = await Promise.all([
            this.usbApi.enumerate(signal),
            this.hidApi?.enumerate(signal),
        ]);

        if (usbResult.success) {
            this.usbDescriptors = usbResult.payload;
        }

        if (hidResult?.success) {
            this.hidDescriptors = hidResult.payload;
        }

        // One failing child must not hide the devices of the other one.
        if (!usbResult.success && !hidResult?.success) {
            return usbResult;
        }

        return success(this.getDescriptors());
    }

    private isHidDeviceOfUsbApi(path: PathInternal) {
        return this.usbDescriptors.some(
            descriptor => descriptor.path === path && descriptor.type === DEVICE_TYPE.TypeT1Hid,
        );
    }

    public openDevice(
        ...[path, options]: AbstractApiArgs<'openDevice'>
    ): Promise<AbstractApiAwaitedResult<'openDevice'>> {
        if (isHidPath(path)) {
            return (
                this.hidApi?.openDevice(path, options) ??
                Promise.resolve(error({ code: ERRORS.DEVICE_NOT_FOUND }))
            );
        }

        // Where libusb manages to open a HID-only device it takes it away from the HID api, and
        // elsewhere the attempt ends with this very error.
        if (this.isHidDeviceOfUsbApi(path)) {
            return Promise.resolve(error({ code: ERRORS.INTERFACE_UNABLE_TO_OPEN_DEVICE }));
        }

        return this.usbApi.openDevice(path, options);
    }

    public closeDevice(
        ...[path, options]: AbstractApiArgs<'closeDevice'>
    ): Promise<AbstractApiAwaitedResult<'closeDevice'>> {
        if (isHidPath(path)) {
            return (
                this.hidApi?.closeDevice(path, options) ??
                Promise.resolve(error({ code: ERRORS.DEVICE_NOT_FOUND }))
            );
        }

        return this.usbApi.closeDevice(path, options);
    }

    public read(
        ...[path, options]: AbstractApiArgs<'read'>
    ): Promise<AbstractApiAwaitedResult<'read'>> {
        if (isHidPath(path)) {
            return (
                this.hidApi?.read(path, options) ??
                Promise.resolve(error({ code: ERRORS.DEVICE_NOT_FOUND }))
            );
        }

        return this.usbApi.read(path, options);
    }

    public write(
        ...[path, buffer, options]: AbstractApiArgs<'write'>
    ): Promise<AbstractApiAwaitedResult<'write'>> {
        if (isHidPath(path)) {
            return (
                this.hidApi?.write(path, buffer, options) ??
                Promise.resolve(error({ code: ERRORS.DEVICE_NOT_FOUND }))
            );
        }

        return this.usbApi.write(path, buffer, options);
    }

    public dispose() {
        this.listening = false;
        this.usbApi.dispose();
        this.hidApi?.dispose();
    }
}
