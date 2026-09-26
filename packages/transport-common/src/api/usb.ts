import { arrayPartition, createDeferred, getSynchronize, resolveAfter } from '@trezor/utils';

import { AbstractApi, type AbstractApiArgs, type AbstractApiConstructorParams } from './abstract';
import {
    CONFIGURATION_ID,
    DEBUGLINK_ENDPOINT_ID,
    DEBUGLINK_INTERFACE_ID,
    DEVICE_TYPE,
    ENDPOINT_ID,
    INTERFACE_ID,
    T1_HID_PRODUCT,
    T1_HID_VENDOR,
    TREZOR_USB_DESCRIPTORS,
    WEBUSB_BOOTLOADER_PRODUCT,
} from '../constants';
import * as ERRORS from '../errors';
import { type DescriptorApiLevel, PathInternal } from '../types';
import type {
    UsbDeviceLike,
    UsbInTransferResultLike,
    UsbInterfaceApi,
} from '../types/usbInterface';
import { DescriptorModel, getUSBDescriptorModel } from '../utils/descriptor';
import { error, success } from '../utils/result';

// usb 3.x cancels transfers after a 1s default timeout, breaking slow flows (PIN, passphrase, THP).
// Pass an effectively-infinite timeout; cancellation stays with our own AbortSignal. Ignored by navigator.usb.
const TRANSFER_TIMEOUT_MS = 0x7fffffff;

// prefix of the positional path assigned to serial-less (bootloader) devices: 'bootloader1', ...
const BOOTLOADER_PATH = 'bootloader';

interface ConstructorParams extends Omit<AbstractApiConstructorParams, 'type'> {
    usbInterface: UsbInterfaceApi;
    forceReadSerialOnConnect?: boolean;
    debugLink?: boolean;
    /**
     * Which usb library backs `usbInterface`, so the version-coupled code paths behave correctly:
     * - 'nusb' (default): usb 3.x (node-usb-rs) - serialNumber is readable after open(); transfer
     *   errors are the nusb Debug variant names.
     * - 'legacy': usb 2.x (libusb) - serialNumber needs an explicit getStringDescriptor read on some
     *   drivers; transfer errors are LIBUSB_ERROR_* codes.
     * Everything else in this class is identical for both. navigator.usb / react-native use 'nusb'.
     */
    usbVersion?: 'legacy' | 'nusb';
}

interface TransportInterfaceDevice {
    path: string;
    device: UsbDeviceLike;
}

export class UsbApi extends AbstractApi {
    chunkSize = 64;

    protected devices: TransportInterfaceDevice[] = [];
    protected usbInterface: ConstructorParams['usbInterface'];
    private forceReadSerialOnConnect?: boolean;
    private abortController = new AbortController();
    private debugLink?: boolean;
    private usbVersion: 'legacy' | 'nusb';
    private synchronizeCreateDevices = getSynchronize();
    private synchronizeGetDevices = getSynchronize();
    /**
     * calling device.reset over other calls often leads to segfault
     */
    private synchronizeResetDevice = getSynchronize();
    private deviceResetMap: Record<string, boolean> = {};
    private devicePendingTransferIn = new Map<UsbDeviceLike, Promise<UsbInTransferResultLike>>();
    /**
     * paths currently inside device.open(). usb 3.x reports opened===false until open() resolves,
     * so reconcileDevices must also preserve a device that is mid-open, otherwise a concurrent
     * enumerate would swap its object for a fresh unopened one and orphan the session.
     */
    private devicesOpening = new Set<string>();

    constructor({
        usbInterface,
        logger,
        forceReadSerialOnConnect,
        debugLink,
        usbVersion,
    }: ConstructorParams) {
        super({ logger, type: 'usb' });

        this.usbInterface = usbInterface;
        this.forceReadSerialOnConnect = forceReadSerialOnConnect;
        this.debugLink = debugLink;
        this.usbVersion = usbVersion ?? 'nusb';
    }

    public listen() {
        this.usbInterface.onconnect = async event => {
            this.logger?.debug(`usb: onconnect: ${this.formatDeviceForLog(event.device)}`);

            // this should fix a bug when device rebooted back to normal mode
            // during fw update on windows throws LIBUSB_ERROR_IO on every transferOut
            if (event.device.opened) {
                this.logger?.debug('usb: onconnect: device already opened, closing');
                await event.device.close();
            }

            return this.createDevices([event.device], this.abortController.signal)
                .then(newDevices => {
                    // usb 3.x (node-usb-rs) hands us a brand-new, unopened device object on every
                    // enumeration/connect. Never let such a fresh object shadow an already-tracked
                    // device that is currently in use (opened) - that would orphan its live handle.
                    const replugged: TransportInterfaceDevice[] = [];
                    newDevices.forEach(newDevice => {
                        const existing = this.devices.find(d => d.path === newDevice.path);
                        // A positional bootloader path that maps to a DIFFERENT physical device must
                        // be tracked alongside, not replace, the existing entry; a same-device
                        // bootloader (a duplicate connect event) falls through to the in-use check.
                        const foreignBootloader =
                            !!existing &&
                            newDevice.path.startsWith(BOOTLOADER_PATH) &&
                            !this.isSameDevice(existing.device, newDevice.device);
                        if (!existing || foreignBootloader) {
                            this.devices.push(newDevice);
                        } else if (this.hasStaleHandle(existing.device, newDevice.device)) {
                            // A connect event whose nusb handle differs from the tracked object is a
                            // fast replug (connect delivered before the old handle's disconnect): the
                            // tracked object's handle is dead. Drop it now so the FIRST emit below
                            // makes the path disappear and the sessions layer invalidates the stale
                            // session, then re-add the fresh object in a SECOND emit so the live
                            // device stays visible for a clean re-acquire. Silently swapping the
                            // object in would keep the session pointing at an unopened object (next
                            // transfer: endpoint not found); dropping without re-adding would lose the
                            // physically-present device (nothing else re-enumerates it on the bridge).
                            this.devicePendingTransferIn.delete(existing.device);
                            this.devices.splice(this.devices.indexOf(existing), 1);
                            replugged.push(newDevice);
                        } else if (
                            !existing.device.opened &&
                            !this.devicesOpening.has(newDevice.path)
                        ) {
                            // replace only a stale, not-in-use entry (e.g. a reconnected device);
                            // never swap a device that is opened or mid-open() - that would orphan
                            // the handle openInternal already captured
                            this.devices[this.devices.indexOf(existing)] = newDevice;
                        }
                        // else: keep the existing in-use object
                    });
                    this.emit('transport-interface-change', this.devicesToDescriptors());
                    if (replugged.length) {
                        // enumerateDone mutates the sessions state synchronously on the first emit,
                        // so by here the stale sessions are dropped; re-add the fresh objects and emit
                        // again to make the replugged devices available with a new session.
                        this.devices.push(...replugged);
                        this.emit('transport-interface-change', this.devicesToDescriptors());
                    }
                })
                .catch(err => {
                    // empty
                    this.logger?.error(`usb: createDevices error: ${err.message}`);
                });
        };

        this.usbInterface.ondisconnect = event => {
            const { device } = event;
            // In usb 3.x serialNumber (and productName/manufacturerName) are fallible getters: when
            // the descriptor was not cached they open the device on access, which throws on a
            // just-unplugged device. Reading it here must never throw - an uncaught listener error
            // can terminate the bridge worker - so treat any failure as "no serial" and fall back
            // to a full re-enumeration, which reconciles the tracked list safely.
            let serialNumber: string | null | undefined;
            try {
                serialNumber = device.serialNumber;
            } catch {
                serialNumber = undefined;
            }

            if (!serialNumber) {
                this.logger?.debug(
                    'usb: ondisconnect: device without serial number, re-enumerating',
                );

                // trezor devices have serial number 468E58AE386B5D2EA8C572A2 or 000000000000000000000000 (for bootloader devices)
                return this.enumerate().then(() => {
                    this.emit('transport-interface-change', this.devicesToDescriptors());
                });
            }

            const tracked = this.devices.find(d => d.path === serialNumber);
            if (tracked && !this.hasStaleHandle(device, tracked.device)) {
                // Only remove when the disconnecting device IS the tracked one. After a fast replug
                // that arrived connect-before-disconnect, the tracked entry already holds the NEWER
                // handle; a late disconnect for the OLD handle must not remove the live newer
                // instance (its handle differs from the disconnecting device's).
                this.devices.splice(this.devices.indexOf(tracked), 1);
                this.devicePendingTransferIn.delete(tracked.device);
                this.emit('transport-interface-change', this.devicesToDescriptors());
            } else if (!tracked) {
                this.logger?.error('usb: device that should be removed does not exist in state');
            }
        };
    }

    private formatDeviceForLog(device: UsbDeviceLike) {
        // usb 3.x exposes productName/manufacturerName/serialNumber as fallible getters that open
        // the device on access and can throw (uncached descriptor / gone device). This helper is
        // called from many fire-and-forget logging sites (e.g. the first statement of onconnect),
        // so it must never throw - a throw here would become an unhandled rejection in the bridge
        // worker. Read each fallible getter defensively.
        const safeRead = (read: () => unknown) => {
            try {
                return read();
            } catch {
                return undefined;
            }
        };

        return JSON.stringify({
            productName: safeRead(() => device.productName),
            manufacturerName: safeRead(() => device.manufacturerName),
            serialNumber: safeRead(() => device.serialNumber),
            vendorId: device.vendorId,
            productId: device.productId,
            deviceVersionMajor: device.deviceVersionMajor,
            deviceVersionMinor: device.deviceVersionMinor,
            opened: device.opened,
        });
    }

    private matchDeviceType(device: UsbDeviceLike) {
        const isBootloader = device.productId === WEBUSB_BOOTLOADER_PRODUCT;
        if (device.deviceVersionMajor === 2) {
            if (isBootloader) {
                return DEVICE_TYPE.TypeT2Boot;
            } else {
                return DEVICE_TYPE.TypeT2;
            }
        } else {
            if (isBootloader) {
                return DEVICE_TYPE.TypeT1WebusbBoot;
            } else if (device.vendorId === T1_HID_VENDOR && device.productId === T1_HID_PRODUCT) {
                return DEVICE_TYPE.TypeT1Hid;
            } else {
                return DEVICE_TYPE.TypeT1Webusb;
            }
        }
    }

    // getUSBDescriptorModel reads the fallible 3.x productName getter (opens device / throws);
    // descriptors are built on the emit path, so a throw must not escape - fall back to UNKNOWN.
    private safeDescriptorModel(device: UsbDeviceLike) {
        try {
            return getUSBDescriptorModel(device);
        } catch {
            return DescriptorModel.UNKNOWN;
        }
    }

    // usb 3.x exposes serialNumber as a fallible getter that opens the device on access and can
    // throw (uncached descriptor, permission denied, just-unplugged device). Reads during
    // enumeration must be defensive: an uncaught throw inside createDevices' Promise.all rejects
    // the WHOLE enumeration and drops every device - even the readable ones - instead of isolating
    // the single unreadable device to a positional path. Treat a throw as "no serial".
    private safeSerialNumber(device: UsbDeviceLike) {
        try {
            return device.serialNumber;
        } catch {
            return undefined;
        }
    }

    private devicesToDescriptors(): DescriptorApiLevel[] {
        return this.devices.map(d => ({
            path: PathInternal(d.path),
            type: this.matchDeviceType(d.device),
            product: d.device.productId,
            vendor: d.device.vendorId,
            // the resolved serial is already the tracked path (for non-bootloader devices), so use
            // it instead of re-reading the fallible serialNumber getter, which in usb 3.x opens the
            // device / throws for an uncached or just-unplugged device on the emit path.
            id: d.path.startsWith(BOOTLOADER_PATH) ? null : d.path,
            apiType: this.type,
            model: this.safeDescriptorModel(d.device),
        }));
    }

    private abortableMethod<R>(
        method: () => Promise<R>,
        { signal, onAbort }: { signal?: AbortSignal; onAbort?: () => Promise<void> | void },
    ) {
        if (!signal) {
            return method();
        }
        if (signal.aborted) {
            return Promise.reject(new Error(ERRORS.ABORTED_BY_SIGNAL));
        }

        const dfd = createDeferred<R>();
        const abortListener = async () => {
            this.logger?.debug('usb: abortableMethod onAbort start');
            try {
                await onAbort?.();
            } catch {
                /* empty */
            }
            this.logger?.debug('usb: abortableMethod onAbort done');
            dfd.reject(new Error(ERRORS.ABORTED_BY_SIGNAL));
        };
        signal?.addEventListener('abort', abortListener);

        const methodPromise = method().catch(error => {
            // NOTE: race condition
            // method() rejects error triggered by signal (device.reset) before dfd.promise (before onAbort finish)
            this.logger?.debug(`usb: abortableMethod method() aborted: ${signal.aborted} ${error}`);
            if (signal.aborted) {
                return dfd.promise;
            }
            dfd.reject(error);
            throw error;
        });

        return Promise.race([methodPromise, dfd.promise])
            .then(r => {
                dfd.resolve(r);

                return r;
            })
            .finally(() => {
                signal?.removeEventListener('abort', abortListener);
            });
    }

    public async enumerate(signal?: AbortSignal) {
        try {
            this.logger?.debug('usb: enumerate');
            const devices = await this.abortableMethod(
                () => this.synchronizeGetDevices(() => this.usbInterface.getDevices()),
                { signal },
            );

            const nextDevices = await this.createDevices(devices, signal);
            this.devices = this.reconcileDevices(nextDevices);

            return success(this.devicesToDescriptors());
        } catch (err) {
            // this shouldn't throw
            return this.unknownError(err);
        }
    }

    /**
     * Merge a freshly enumerated device list into the tracked one, preserving the object
     * identity of devices that are currently in use.
     *
     * usb 2.x reused a stable device object per physical device (it kept its open handle and
     * claimed interface across enumerations). usb 3.x (node-usb-rs) returns a brand-new,
     * UNOPENED object on every getDevices() call. Because read/write/openDevice resolve the
     * device object by path at call time, blindly replacing the tracked list would swap an
     * in-use device's live object for a fresh unopened one, so its next transfer would hit an
     * unopened/unclaimed device ("endpoint not found" / "invalid state") and the session would
     * collapse - even when the enumeration was triggered by an unrelated device. Keeping the
     * existing opened object restores the usb 2.x behaviour where re-enumerating mid-session is
     * harmless.
     */
    private reconcileDevices(nextDevices: TransportInterfaceDevice[]) {
        const nextPaths = new Set(nextDevices.map(d => d.path));
        // drop pending reads for devices that are no longer present
        this.devices.forEach(prev => {
            if (!nextPaths.has(prev.path)) {
                this.devicePendingTransferIn.delete(prev.device);
            }
        });

        return nextDevices.flatMap(next => {
            const existing = this.devices.find(prev => prev.path === next.path);
            if (!existing) {
                return [next];
            }
            // Reuse the tracked object only while it is in use - opened, or currently inside
            // device.open() (opened is still false during the open() await). A closed/idle entry is
            // safely refreshed with the fresh object (e.g. a reconnected device gets a new handle).
            const inUse = existing.device.opened || this.devicesOpening.has(next.path);
            // A fast unplug/replug gives the same serial path a NEW nusb handle, so the in-use
            // tracked object's OS handle is dead. DROP the device (rather than silently swapping in
            // the fresh unopened object): this makes the sessions layer see the path disappear and
            // invalidate the now-stale session, and the next enumerate re-adds the fresh device for a
            // clean re-acquire - mirroring a physical disconnect+reconnect. Silently swapping would
            // instead leave the session pointing at an unopened object whose next transfer fails
            // "endpoint not found". (Only meaningful when both objects expose a handle: nusb always
            // does; navigator.usb / react-native have none and a replug there yields a new object.)
            if (inUse && this.hasStaleHandle(existing.device, next.device)) {
                this.devicePendingTransferIn.delete(existing.device);

                return [];
            }
            // A stable serial path always identifies the same physical device. A positional
            // bootloader path (bootloader1, ...) can map to a DIFFERENT device after another
            // bootloader (un)plugs, so for those only preserve when the fresh object is provably the
            // same physical device (node-usb-rs handle); otherwise adopt the fresh object. This keeps
            // an active serial-less bootloader alive (e.g. mid firmware update) without resurrecting
            // a disconnected device's handle on positional renumbering.
            const samePhysicalDevice =
                !next.path.startsWith(BOOTLOADER_PATH) ||
                this.isSameDevice(existing.device, next.device);
            if (inUse && samePhysicalDevice) {
                return [existing];
            }

            return [next];
        });
    }

    /**
     * usb 3.x hands out a fresh UsbDevice object on every getDevices(), so object identity is not a
     * reliable "same physical device" test. node-usb-rs exposes a stable per-physical-device handle
     * we can compare instead; when it is unavailable (navigator.usb / react-native-usb) we fall
     * back to object identity, which IS stable on those interfaces.
     */
    private isSameDevice(a: UsbDeviceLike, b: UsbDeviceLike) {
        return a.handle != null && b.handle != null ? a.handle === b.handle : a === b;
    }

    // usb 3.x hands out a fresh UsbDevice object on every getDevices() but keeps a STABLE per-
    // physical-device handle while the device stays connected; a fast unplug/replug yields a NEW
    // handle. So a tracked object whose handle no longer matches the freshly enumerated one is
    // holding a dead OS handle (its next transfer fails with "device disconnected during action")
    // and must be replaced by the fresh object even under a stable serial path. Only meaningful
    // when both objects expose a handle (nusb); navigator.usb / react-native have none and rely on
    // object identity, where a replug already yields a new object.
    private hasStaleHandle(tracked: UsbDeviceLike, fresh: UsbDeviceLike) {
        return tracked.handle != null && fresh.handle != null && tracked.handle !== fresh.handle;
    }

    private getTransferIn(device: UsbDeviceLike) {
        let pending = this.devicePendingTransferIn.get(device);
        if (!pending) {
            pending = device
                .transferIn(
                    this.debugLink ? DEBUGLINK_ENDPOINT_ID : ENDPOINT_ID,
                    this.chunkSize,
                    TRANSFER_TIMEOUT_MS,
                )
                .finally(() => this.devicePendingTransferIn.delete(device));
            this.devicePendingTransferIn.set(device, pending);
        }

        return pending;
    }

    public async read(...[path, options]: AbstractApiArgs<'read'>) {
        const device = this.findDevice(path);
        if (!device) {
            return error({ code: ERRORS.DEVICE_NOT_FOUND });
        }

        try {
            this.logger?.debug('usb: device.transferIn');
            const res = await this.abortableMethod(() => this.getTransferIn(device), {
                signal: options?.signal,
                onAbort: () => this.resetDevice(path),
            });
            this.logger?.debug(
                `usb: device.transferIn done. status: ${res.status}, byteLength: ${res.data?.byteLength}.`,
            );

            if (!res.data?.byteLength) {
                this.logger?.warn(`usb: device.transferIn error: empty data buffer`);

                return success(Buffer.alloc(0));
            }

            return success(Buffer.from(res.data.buffer));
        } catch (err) {
            this.logger?.error(`usb: device.transferIn error ${err}`);

            return this.handleReadWriteError(err);
        }
    }

    public async write(...[path, buffer, options]: AbstractApiArgs<'write'>) {
        const device = this.findDevice(path);
        if (!device) {
            return error({ code: ERRORS.DEVICE_NOT_FOUND });
        }

        let newArray: Uint8Array<ArrayBuffer>;
        if (this.nativeWriteChunking) {
            // Pass the full buffer for native chunking
            newArray = new Uint8Array(buffer);
        } else {
            newArray = new Uint8Array(this.chunkSize);
            newArray.set(new Uint8Array(buffer));
        }

        const timeout = setTimeout(() => {
            this.logger?.debug('usb: device.transfer out take suspiciously long. timing out.');
            this.resetDevice(path).catch(() => {});
        }, 1000);

        try {
            // https://wicg.github.io/webusb/#ref-for-dom-usbdevice-transferout
            this.logger?.debug('usb: device.transferOut');

            const result = await this.abortableMethod(
                () =>
                    device.transferOut(
                        this.debugLink ? DEBUGLINK_ENDPOINT_ID : ENDPOINT_ID,
                        newArray,
                        TRANSFER_TIMEOUT_MS,
                    ),
                { signal: options?.signal, onAbort: () => this.resetDevice(path) },
            );
            this.logger?.debug(`usb: device.transferOut done.`);
            if (result.status !== 'ok') {
                this.logger?.error(`usb: device.transferOut status not ok: ${result.status}`);
                throw new Error('transfer out status not ok');
            }

            return success(undefined);
        } catch (err) {
            return this.handleReadWriteError(err);
        } finally {
            clearTimeout(timeout);
        }
    }

    public async openDevice(...[path, options]: AbstractApiArgs<'openDevice'>) {
        // note: multiple retries to open device. reason:  when another window acquires device, changed session
        // is broadcasted to other clients. they are responsible for releasing interface, which takes some time.
        // if there is only one client working with device, this will succeed using only one attempt.

        // note: why for instead of scheduleAction from @trezor/utils with attempts param. this.openInternal does not throw
        // I would need to throw artificially which is not nice.
        for (let i = 0; i < 5; i++) {
            this.logger?.debug(`usb: openDevice attempt ${i}`);
            const res = await this.openInternal(path, options);
            if (res.success || options?.signal?.aborted) {
                return res;
            }

            await resolveAfter(100 * i);
        }

        return this.openInternal(path, options);
    }

    private async openInternal(...[path, options]: AbstractApiArgs<'openDevice'>) {
        const { signal, reset } = options || { reset: false };
        const device = this.findDevice(path);
        if (!device) {
            return error({ code: ERRORS.DEVICE_NOT_FOUND });
        }

        try {
            this.logger?.debug(`usb: device.open`);
            // mark the path as opening so a concurrent enumerate/reconcile keeps this object
            // (device.opened stays false until open() resolves)
            this.devicesOpening.add(path);
            try {
                await this.abortableMethod(() => device.open(), { signal });
            } finally {
                this.devicesOpening.delete(path);
            }
            this.logger?.debug(`usb: device.open done. device: ${this.formatDeviceForLog(device)}`);
        } catch (err) {
            this.logger?.error(`usb: device.open error ${err}`);
            // usb 3.x (nusb) reports EACCES/EPERM as "open error: permission denied (...)" instead
            // of a libusb code; map it to the same access error so DeviceUnreadable keeps showing
            // the Linux udev-rules installation tip.
            if (
                err.message.includes('LIBUSB_ERROR_ACCESS') ||
                err.message.toLowerCase().includes('permission denied')
            ) {
                return error({ code: ERRORS.LIBUSB_ERROR_ACCESS });
            }

            return error({
                code: ERRORS.INTERFACE_UNABLE_TO_OPEN_DEVICE,
                message: err.message,
            });
        }

        if (this.readConfiguration(device)?.configurationValue !== CONFIGURATION_ID) {
            try {
                this.logger?.debug(`usb: device.selectConfiguration ${CONFIGURATION_ID}`);
                await this.abortableMethod(() => device.selectConfiguration(CONFIGURATION_ID), {
                    signal,
                });
                this.logger?.debug(`usb: device.selectConfiguration done: ${CONFIGURATION_ID}.`);
            } catch (err) {
                this.logger?.error(
                    `usb: device.selectConfiguration error ${err}. device: ${this.formatDeviceForLog(device)}`,
                );
            }
        }

        if (reset) {
            try {
                // reset fails on ChromeOS and windows
                this.logger?.debug('usb: device.reset');
                await this.resetDevice(path);
                this.logger?.debug(`usb: device.reset done.`);
            } catch (err) {
                this.logger?.error(
                    `usb: device.reset error ${err}. device: ${this.formatDeviceForLog(device)}`,
                );
                // empty
            }
        }

        const interfaceId = this.debugLink ? DEBUGLINK_INTERFACE_ID : INTERFACE_ID;
        if (!this.isInterfaceClaimed(device, interfaceId)) {
            try {
                this.logger?.debug(`usb: device.claimInterface: ${interfaceId}`);
                // claim device for exclusive access by this app
                await this.abortableMethod(() => device.claimInterface(interfaceId), { signal });
                this.logger?.debug(`usb: device.claimInterface done: ${interfaceId}.`);
            } catch (err) {
                this.logger?.error(`usb: device.claimInterface error ${err}.`);

                return error({
                    code: ERRORS.INTERFACE_UNABLE_TO_OPEN_DEVICE,
                    message: err.message,
                });
            }
        }

        return success(undefined);
    }

    public async closeDevice(...[path]: AbstractApiArgs<'closeDevice'>) {
        let device = this.findDevice(path);
        if (!device) {
            return error({ code: ERRORS.DEVICE_NOT_FOUND });
        }

        this.logger?.debug(`usb: closeDevice. device.opened: ${device.opened}`);

        if (device.opened) {
            if (!this.debugLink) {
                try {
                    // NOTE: `device.reset()` interrupts transfers for all interfaces (debugLink and normal)
                    await this.resetDevice(path);
                } catch (err) {
                    this.logger?.error(
                        `usb: device.reset error ${err}. device: ${this.formatDeviceForLog(device)}`,
                    );
                }
            }
        }

        device = this.findDevice(path);
        const interfaceId = this.debugLink ? DEBUGLINK_INTERFACE_ID : INTERFACE_ID;
        if (device?.opened && this.isInterfaceClaimed(device, interfaceId)) {
            try {
                this.logger?.debug(`usb: device.releaseInterface: ${interfaceId}`);

                await this.synchronizeResetDevice(() => device?.releaseInterface(interfaceId));
                this.logger?.debug(`usb: device.releaseInterface done: ${interfaceId}.`);
            } catch (err) {
                this.logger?.error(`usb: releaseInterface error ${err}.`);
                // ignore
            }
        }
        device = this.findDevice(path);
        if (device?.opened) {
            try {
                this.logger?.debug(`usb: device.close`);
                await this.synchronizeResetDevice(() => device.close());
                this.logger?.debug(`usb: device.close done.`);
            } catch (err) {
                this.logger?.debug(`usb: device.close error ${err}.`);

                return error({
                    code: ERRORS.INTERFACE_UNABLE_TO_CLOSE_DEVICE,
                    message: err.message,
                });
            }
        }

        return success(undefined);
    }

    private findDevice(path: string) {
        const device = this.devices.find(d => d.path === path);
        if (!device) {
            return;
        }

        return device.device;
    }

    private createDevices(devices: UsbDeviceLike[], signal?: AbortSignal) {
        return this.synchronizeCreateDevices(async () => {
            let bootloaderId = 0;

            const getPathFromUsbDevice = (device: UsbDeviceLike) => {
                // path is just serial number
                // more bootloaders => number them, hope for the best
                const serialNumber = this.safeSerialNumber(device);
                let path =
                    serialNumber == null || serialNumber === '' ? BOOTLOADER_PATH : serialNumber;
                if (path === BOOTLOADER_PATH) {
                    this.logger?.debug('usb: device without serial number!');
                    bootloaderId++;
                    path += bootloaderId;
                }

                return path;
            };

            const [hidDevices, nonHidDevices] = this.filterDevices(devices);

            const loadedDevices = await Promise.all(
                nonHidDevices.map(async device => {
                    this.logger?.debug(`usb: creating device ${this.formatDeviceForLog(device)}`);

                    if (
                        this.forceReadSerialOnConnect &&
                        // device already has serialNumber or it is open - both cases mean that we already seen it before and don't need to bother
                        !device.opened &&
                        !this.safeSerialNumber(device)
                    ) {
                        // try to load serialNumber. if this doesn't succeed, we can still continue normally. the only problem is that multiple devices
                        // connected at the same time will not be properly distinguished.
                        try {
                            await this.loadSerialNumber(device, signal);
                        } catch (err) {
                            // An abort (dispose/shutdown) must still cancel the whole enumeration.
                            if (signal?.aborted) {
                                throw err;
                            }
                            // Any other failure is per-device and non-fatal: a single unreadable
                            // device (permission denied, gone) must not reject the whole Promise.all
                            // and drop every device with it - it just falls back to a positional path.
                        }
                    }
                    const path = getPathFromUsbDevice(device);

                    return { path, device };
                }),
            );

            return [
                ...loadedDevices,
                ...hidDevices.map(d => ({
                    path: getPathFromUsbDevice(d),
                    device: d,
                })),
            ];
        });
    }

    /*
     * depending on OS (and specific usb drivers), it might be required to open device in order to read serial number.
     * https://github.com/node-usb/node-usb/issues/546
     */
    private async loadSerialNumber(device: UsbDeviceLike, signal?: AbortSignal) {
        let opened = false;
        try {
            this.logger?.debug(`usb: loadSerialNumber`);

            await this.abortableMethod(() => device.open(), { signal });
            opened = true;
            if (this.usbVersion === 'legacy' && device.getStringDescriptor && device.device) {
                // usb 2.x (libusb): on some drivers (notably Windows, node-usb issue #546) the
                // serial number is only readable via an explicit low-level string-descriptor read
                // after opening. usb 3.x drops this API and exposes serialNumber as a plain WebUSB
                // getter, so this branch is legacy-only.
                await this.abortableMethod(
                    () =>
                        device.getStringDescriptor!(device.device!.deviceDescriptor.iSerialNumber),
                    { signal },
                );
            }
            // read the serial defensively for the log: in usb 3.x it is a fallible getter that can
            // throw, and a throw here must NOT skip the close() in finally.
            this.logger?.debug(
                `usb: loadSerialNumber done, serialNumber: ${this.safeSerialNumber(device)}`,
            );
        } catch (err) {
            this.logger?.error(`usb: loadSerialNumber error: ${err.message}`);
            throw err;
        } finally {
            // Always close a device we opened, even if the serial read threw. Otherwise it stays
            // opened and reconcileDevices (which keys on .opened) would treat this mere probe as an
            // in-use device. Close directly (not via abortableMethod) so an aborted signal still
            // releases the handle.
            if (opened) {
                await device.close().catch(() => {});
            }
        }
    }

    private async resetDevice(path: string) {
        const device = this.findDevice(path);

        if (!device) {
            this.logger?.debug(`usb: resetDevice: device not found`);

            return;
        }

        if (this.deviceResetMap[path]) {
            // if this gets printed, it is an indication of some code smell. there shouldn't be need for calling device reset multiple times
            this.logger?.debug(`usb: resetDevice: device reset already running`);

            return;
        }

        this.deviceResetMap[path] = true;
        try {
            this.logger?.debug(`usb: resetDevice: device.reset`);
            await this.synchronizeResetDevice(() => device.reset());
            this.logger?.debug(`usb: resetDevice: device.reset done`);
        } catch (err) {
            this.logger?.error(`usb: resetDevice: device.reset error: ${err.message}`);
        } finally {
            delete this.deviceResetMap[path];
        }
    }

    private filterDevices(devices: UsbDeviceLike[]): [UsbDeviceLike[], UsbDeviceLike[]] {
        const trezorDevices = devices.filter(dev =>
            TREZOR_USB_DESCRIPTORS.some(
                desc => dev.vendorId === desc.vendorId && dev.productId === desc.productId,
            ),
        );
        const [hidDevices, nonHidDevices] = arrayPartition(
            trezorDevices,
            device => device.vendorId === T1_HID_VENDOR,
        );

        return [hidDevices, nonHidDevices];
    }

    // usb 3.x exposes `configuration` as a fallible getter that performs control-transfer I/O and
    // can throw ("configuration error: ..."); in 2.x it was a cached non-throwing property. Reading
    // it must never throw out of openDevice/closeDevice - their callers (bridge core/http) treat
    // those as non-throwing and a raw throw would leak the session lock / crash the worker.
    private readConfiguration(device: UsbDeviceLike) {
        try {
            return device.configuration;
        } catch {
            return undefined;
        }
    }

    private isInterfaceClaimed(device: UsbDeviceLike, interfaceId: number) {
        return this.readConfiguration(device)?.interfaces.find(
            i => i.interfaceNumber === interfaceId,
        )?.claimed;
    }
    // https://github.com/trezor/trezord-go/blob/db03d99230f5b609a354e3586f1dfc0ad6da16f7/usb/libusb.go#L545
    private handleReadWriteError(err: Error) {
        if (
            [
                // node usb: usb 3.x is nusb-based and formats transfer errors with Rust's Debug
                // ({:?}), so they arrive as the bare nusb TransferError variant name, e.g.
                // "transferOut error: Disconnected". These mirror the libusb errors the 2.x
                // transport treated as a disconnect-during-action (NO_DEVICE/PIPE/IO/OTHER). We
                // deliberately exclude Cancelled (our own AbortSignal/OS abort), InvalidArgument
                // (a programming error) and "endpoint not found" (an unclaimed interface), which
                // must stay UNEXPECTED_ERROR.
                'Disconnected', // device gone (~LIBUSB_ERROR_NO_DEVICE)
                'Stall', // endpoint stalled (~LIBUSB_ERROR_PIPE; Windows ERROR_GEN_FAILURE)
                'Fault', // I/O or protocol fault (~LIBUSB_ERROR_IO)
                'Unknown', // OS-specific transfer failure (~LIBUSB_ERROR_OTHER)
                // node usb 2.x (legacy, libusb) - kept as a superset so the same class serves both
                // usb versions; these strings never appear in nusb output and vice versa.
                'LIBUSB_TRANSFER_ERROR',
                'LIBUSB_ERROR_PIPE',
                'LIBUSB_ERROR_IO',
                'LIBUSB_ERROR_NO_DEVICE',
                'LIBUSB_ERROR_OTHER',
                // web usb
                ERRORS.INTERFACE_DATA_TRANSFER,
                'The device was disconnected.',
            ].some(disconnectedErr => err.message.includes(disconnectedErr))
        ) {
            return error({ code: ERRORS.DEVICE_DISCONNECTED_DURING_ACTION });
        }

        return this.unknownError(err, [
            ERRORS.DEVICE_NOT_FOUND,
            ERRORS.INTERFACE_UNABLE_TO_OPEN_DEVICE,
            ERRORS.DEVICE_DISCONNECTED_DURING_ACTION,
            ERRORS.ABORTED_BY_TIMEOUT,
            ERRORS.ABORTED_BY_SIGNAL,
            ERRORS.UNEXPECTED_ERROR,
        ]);
    }

    public dispose() {
        if (this.usbInterface) {
            this.usbInterface.onconnect = null;
            this.usbInterface.ondisconnect = null;
        }
        this.abortController.abort();
        // try to close opened devices. this is not guaranteed to succeed, but it is better than nothing.
        this.devices.forEach(d => {
            if (d.device.opened) {
                d.device.close().catch(() => {});
            }
        });
    }
}
