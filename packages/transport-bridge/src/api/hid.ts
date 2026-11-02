import { createHash } from 'crypto';
import type { Device as NodeHidDevice } from 'node-hid';

import {
    AbstractApi,
    type AbstractApiArgs,
    type AbstractApiAwaitedResult,
    type AbstractApiConstructorParams,
    DEVICE_TYPE,
    type DescriptorApiLevel,
    TRANSPORT_ERROR as ERRORS,
    PathInternal,
    T1_HID_PRODUCT,
    T1_HID_VENDOR,
    error,
    success,
} from '@trezor/transport-common';
import { resolveAfter } from '@trezor/utils';

const HID_PATH_PREFIX = 'hid-';

// Vendor-defined usage page of the Trezor One wire interface. The U2F and debug link interfaces
// of the same device use different pages and must not be opened.
const WIRE_USAGE_PAGE = 0xff00;
const WIRE_INTERFACE = 0;
const ENUMERATE_INTERVAL = 500;
// A short timeout keeps the read loop responsive to abort, takeover and close. trezord-go
// segfaulted on Windows when a handle was closed while a blocking read was in flight.
const READ_TIMEOUT = 50;
// Upper bound for the reports thrown away on a session takeover. A response of the firmware
// spans a few reports, the limit only keeps a misbehaving device from blocking the takeover.
const MAX_DISCARDED_REPORTS = 64;
const UNNUMBERED_REPORT_ID = Buffer.from([0x00]);
// An unnumbered report whose packet does not start with '?'. The firmware drops a partially
// received message on it and ignores it otherwise, so it probes the report format and cleans up
// after a previous owner that was cut off in the middle of a message. A bootloader in the middle
// of a firmware upload aborts the installation on it, which happens only once that upload was
// cut off anyway.
const READER_RESET_REPORT = Buffer.alloc(65, 0);
// Firmware 1.3.5 and older and bootloader 1.2.x number their reports and take only number 63, the
// leading '?' of every packet. trezord-go probed with the same packet.
const NUMBERED_REPORT_PROBE = Buffer.concat([Buffer.from('?'), Buffer.alloc(63, 0xff)]);

type HidHandle = {
    read: (timeout?: number) => Promise<Buffer | undefined>;
    write: (values: Buffer) => Promise<number>;
    close: () => Promise<void>;
};

/** Subset of the `node-hid` module used by `HidApi`. */
export type NodeHid = {
    devicesAsync: (vendorId: number, productId: number) => Promise<NodeHidDevice[]>;
    HIDAsync: { open: (path: string) => Promise<HidHandle> };
    getHidapiVersion: () => string;
};

type OpenedDevice = {
    handle: HidHandle;
    shouldPrependReportId: boolean;
    // Bumped whenever the in-flight read has to give up: session takeover or close.
    readGeneration: number;
    // Set while a session takeover drains the transfers of the previous owner.
    isTakenOver: boolean;
    pendingTransfers: Set<Promise<unknown>>;
};

type HidApiParams = Omit<AbstractApiConstructorParams, 'type'> & {
    /** Called by the first enumeration, so that a bridge nobody asks for devices never loads it. */
    loadNodeHid: () => NodeHid;
};

const isWireInterface = (device: NodeHidDevice) =>
    // hidapi reports interface -1 when it cannot read the interface number, the usage page then
    // remains the only marker.
    device.interface === WIRE_INTERFACE || device.usagePage === WIRE_USAGE_PAGE;

// The system path names the device for the operating system (an IORegistry entry ID on macOS, a
// device interface path on Windows) and must not leave the machine, so descriptors carry only its
// digest. trezord-go identified HID devices the same way.
const createPath = (systemPath: string) =>
    PathInternal(`${HID_PATH_PREFIX}${createHash('sha256').update(systemPath).digest('hex')}`);

// Enough of the digest to tell devices apart in the log.
const getShortPath = (path: PathInternal) => path.slice(0, 12);

/**
 * Talks to Trezor One devices that only expose a HID interface (firmware 1.6.3 and older).
 * Error messages from `node-hid` are never passed on in results, a failed open names the system
 * path. The log gets that message with the system path blanked out.
 */
export class HidApi extends AbstractApi {
    chunkSize = 64;

    private readonly loadNodeHid: () => NodeHid;
    private nodeHid?: NodeHid;
    private isDisposed = false;
    private systemPaths = new Map<PathInternal, string>();
    private openedDevices = new Map<PathInternal, OpenedDevice>();
    // Last logged interface list. The empty one counts as logged, a machine without a HID
    // Trezor One has nothing to report.
    private lastInterfaces = '[]';

    constructor({ logger, loadNodeHid }: HidApiParams) {
        super({ logger, type: 'usb' });
        this.loadNodeHid = loadNodeHid;
    }

    public listen() {
        this.listening = true;
    }

    // The node-hid library has no hotplug events. Polling starts once the addon is loaded rather
    // than with `listen`, the bridge core listens as soon as it is created.
    private async listenLoop() {
        while (!this.isDisposed) {
            await resolveAfter(ENUMERATE_INTERVAL);
            if (this.isDisposed) break;
            await this.enumerate();
        }
    }

    private getNodeHid() {
        if (!this.nodeHid) {
            const nodeHid = this.loadNodeHid();
            // node-hid loads its native binding on first use. Asking for the version loads it
            // here, so that a broken addon fails before it is reported as loaded.
            const hidapiVersion = nodeHid.getHidapiVersion();
            this.nodeHid = nodeHid;
            this.logger?.info(`hid: node-hid loaded, hidapi ${hidapiVersion}`);
            this.listenLoop();
        }

        return this.nodeHid;
    }

    private describeError(err: unknown) {
        return err instanceof Error ? err.message : String(err);
    }

    public async enumerate(..._args: AbstractApiArgs<'enumerate'>) {
        try {
            const devices = await this.getNodeHid().devicesAsync(T1_HID_VENDOR, T1_HID_PRODUCT);
            const systemPaths = new Map<PathInternal, string>();
            devices.forEach(device => {
                if (device.path && isWireInterface(device)) {
                    systemPaths.set(createPath(device.path), device.path);
                }
            });
            const interfaces = JSON.stringify(
                devices.map(device => ({
                    interface: device.interface,
                    usagePage: device.usagePage,
                    usage: device.usage,
                    release: device.release,
                })),
            );
            // The listen loop enumerates twice a second while the log keeps a limited number of
            // messages. Logging an unchanged list would push every other line out of it.
            if (interfaces !== this.lastInterfaces) {
                this.lastInterfaces = interfaces;
                this.logger?.debug(
                    `hid: enumerate: ${devices.length} interfaces of 534c:0001, ${systemPaths.size} wire interfaces ${interfaces}`,
                );
            }
            this.handleDevicesChange(systemPaths);

            return success(this.getDescriptors());
        } catch (err) {
            this.logger?.error(`hid: enumerate failed: ${this.describeError(err)}`);

            return error({ code: ERRORS.UNEXPECTED_ERROR });
        }
    }

    private getDescriptors(): DescriptorApiLevel[] {
        return Array.from(this.systemPaths.keys(), path => ({
            path,
            type: DEVICE_TYPE.TypeT1Hid,
            product: T1_HID_PRODUCT,
            vendor: T1_HID_VENDOR,
            apiType: this.type,
            id: null,
        }));
    }

    private handleDevicesChange(systemPaths: Map<PathInternal, string>) {
        const disconnectedPaths = Array.from(this.systemPaths.keys()).filter(
            path => !systemPaths.has(path),
        );
        const hasConnectedDevice = Array.from(systemPaths.keys()).some(
            path => !this.systemPaths.has(path),
        );
        this.systemPaths = systemPaths;

        if (disconnectedPaths.length > 0 || hasConnectedDevice) {
            this.logger?.info(
                `hid: devices changed: ${systemPaths.size} connected, ${disconnectedPaths.length} disconnected`,
            );
        }
        disconnectedPaths.forEach(path => this.closeDevice(path));

        if ((disconnectedPaths.length > 0 || hasConnectedDevice) && this.listening) {
            this.emit('transport-interface-change', this.getDescriptors());
        }
    }

    public async openDevice(
        ...[path, options]: AbstractApiArgs<'openDevice'>
    ): Promise<AbstractApiAwaitedResult<'openDevice'>> {
        const openedDevice = this.openedDevices.get(path);
        if (openedDevice) {
            // The bridge core re-opens an already opened path when a session is taken over. The
            // read of the previous owner has to finish before the new owner sends anything,
            // otherwise it would swallow the first chunk of the response meant for the new owner.
            if (options?.reset) {
                this.logger?.info(`hid: ${getShortPath(path)} reopened for a new session`);
                openedDevice.readGeneration += 1;
                const takeoverGeneration = openedDevice.readGeneration;
                // The flag is set before the first await, so that every chunk the previous owner
                // writes from now on is rejected. Otherwise its remaining chunks would interleave
                // with the first message of the new owner on the wire.
                openedDevice.isTakenOver = true;
                await Promise.allSettled(Array.from(openedDevice.pendingTransfers));
                await this.discardQueuedReports(openedDevice, takeoverGeneration);
                await this.resetFirmwareReader(openedDevice, takeoverGeneration);
                // A close, a disconnect or a newer takeover moved the generation, this takeover
                // has no device to hand over.
                if (openedDevice.readGeneration !== takeoverGeneration) {
                    return error({ code: ERRORS.DEVICE_NOT_FOUND });
                }
                openedDevice.isTakenOver = false;
            }

            return success(undefined);
        }

        const systemPath = this.systemPaths.get(path);
        if (!systemPath) {
            this.logger?.error(`hid: ${getShortPath(path)} not found for open`);

            return error({ code: ERRORS.DEVICE_NOT_FOUND });
        }

        this.logger?.info(`hid: ${getShortPath(path)} opening on ${process.platform}`);
        try {
            const handle = await this.getNodeHid().HIDAsync.open(systemPath);
            const shouldPrependReportId = await this.detectReportIdPrepend(handle);
            if (shouldPrependReportId === undefined) {
                this.logger?.error(`hid: ${getShortPath(path)} accepts neither report format`);
                await handle.close().catch(() => {});

                return error({ code: ERRORS.INTERFACE_UNABLE_TO_OPEN_DEVICE });
            }
            // The listen loop may have seen the device disconnect while it was being opened, the api
            // may have been disposed or another open of the path may have finished meanwhile.
            // Nothing would ever close a handle stored now.
            if (
                this.isDisposed ||
                this.systemPaths.get(path) !== systemPath ||
                this.openedDevices.has(path)
            ) {
                this.logger?.info(`hid: ${getShortPath(path)} gone while opening`);
                await handle.close().catch(() => {});

                return error({ code: ERRORS.DEVICE_NOT_FOUND });
            }
            this.openedDevices.set(path, {
                handle,
                shouldPrependReportId,
                readGeneration: 0,
                isTakenOver: false,
                pendingTransfers: new Set(),
            });
            this.logger?.info(
                `hid: ${getShortPath(path)} opened, report id prepend: ${shouldPrependReportId}`,
            );

            return success(undefined);
        } catch (err) {
            // node-hid, and hidapi on Linux, name the system path in the message of a failed open.
            const message = this.describeError(err).replaceAll(systemPath, '<redacted>');
            this.logger?.error(`hid: ${getShortPath(path)} open failed: ${message}`);

            return error({ code: ERRORS.INTERFACE_UNABLE_TO_OPEN_DEVICE });
        }
    }

    // Firmware 1.3.6 and newer declares the wire packets as an unnumbered report, and hidapi then
    // wants a leading zero report ID: on macOS it hands the first byte to `IOHIDDeviceSetReport`
    // as the report number unless it is zero, and Windows rejects the bare packet outright. Older
    // firmware and bootloader 1.2.x number the wire report and take the packet as it is, its
    // leading '?' being report number 63. Only Windows refuses them the zero report ID, so only
    // there trying tells the two apart, as in trezord-go. Resolves to undefined when the device
    // takes neither.
    private async detectReportIdPrepend(handle: HidHandle): Promise<boolean | undefined> {
        if (await this.isProbeAccepted(handle, READER_RESET_REPORT)) return true;
        if (await this.isProbeAccepted(handle, NUMBERED_REPORT_PROBE)) return false;

        return undefined;
    }

    private async isProbeAccepted(handle: HidHandle, probe: Buffer) {
        const writtenLength = await handle.write(probe).catch(err => {
            this.logger?.debug(`hid: probe rejected: ${this.describeError(err)}`);

            return undefined;
        });
        this.logger?.debug(`hid: probe of ${probe.length} bytes wrote ${writtenLength} bytes`);

        return writtenLength === probe.length;
    }

    // A response the previous owner never read stays queued on the handle. The new owner would
    // take it for the answer to its first call.
    private async discardQueuedReports(device: OpenedDevice, readGeneration: number) {
        for (let discarded = 0; discarded < MAX_DISCARDED_REPORTS; discarded += 1) {
            // A close or a further takeover moves the generation of the device. Draining on would
            // queue reads behind the `handle.close` that already waited for the pending ones.
            if (device.readGeneration !== readGeneration) {
                return;
            }

            const report = await this.trackTransfer(device, device.handle.read(READ_TIMEOUT)).catch(
                () => undefined,
            );
            if (!report?.length) {
                if (discarded > 0) this.logger?.info(`hid: discarded ${discarded} queued reports`);

                return;
            }
        }
        this.logger?.error(
            `hid: device still sending after ${MAX_DISCARDED_REPORTS} discarded reports`,
        );
    }

    // Rejecting the remaining chunks of the previous owner can leave the firmware in the middle
    // of a message, and it would take the first chunk of the new owner for the rest of it.
    private async resetFirmwareReader(device: OpenedDevice, readGeneration: number) {
        // Without the zero report ID, on Windows with numbered reports, every packet is report 63
        // and starts with '?', so none resets the reader.
        if (!device.shouldPrependReportId || device.readGeneration !== readGeneration) {
            return;
        }

        await this.trackTransfer(device, device.handle.write(READER_RESET_REPORT)).catch(
            () => undefined,
        );
    }

    private trackTransfer<T>(device: OpenedDevice, transfer: Promise<T>) {
        device.pendingTransfers.add(transfer);
        transfer.finally(() => device.pendingTransfers.delete(transfer)).catch(() => {});

        return transfer;
    }

    public async read(
        ...[path, options]: AbstractApiArgs<'read'>
    ): Promise<AbstractApiAwaitedResult<'read'>> {
        const device = this.openedDevices.get(path);
        if (!device) {
            return error({ code: ERRORS.DEVICE_NOT_FOUND });
        }

        // The takeover lets the read in flight finish and then drains the rest of the response.
        // A read the previous owner starts meanwhile would take a part of it and keep holding
        // the call lock of the device, so the new owner could not call.
        if (device.isTakenOver) {
            return error({ code: ERRORS.DEVICE_DISCONNECTED_DURING_ACTION });
        }

        const { readGeneration } = device;
        const signal = options?.signal;

        while (!signal?.aborted) {
            if (device.readGeneration !== readGeneration) {
                return error({ code: ERRORS.DEVICE_DISCONNECTED_DURING_ACTION });
            }

            try {
                const report = await this.trackTransfer(device, device.handle.read(READ_TIMEOUT));
                // A timed out read and an occasional empty report both mean "nothing yet".
                if (report?.length) {
                    this.logger?.debug(`hid: ${getShortPath(path)} read ${report.length} bytes`);

                    return success(report);
                }
            } catch (err) {
                this.logger?.error(
                    `hid: ${getShortPath(path)} read failed: ${this.describeError(err)}`,
                );

                return error({ code: ERRORS.INTERFACE_DATA_TRANSFER });
            }
        }

        return error({ code: ERRORS.ABORTED_BY_SIGNAL });
    }

    public async write(
        ...[path, buffer, options]: AbstractApiArgs<'write'>
    ): Promise<AbstractApiAwaitedResult<'write'>> {
        const device = this.openedDevices.get(path);
        if (!device) {
            return error({ code: ERRORS.DEVICE_NOT_FOUND });
        }

        if (options?.signal?.aborted) {
            return error({ code: ERRORS.ABORTED_BY_SIGNAL });
        }

        if (device.isTakenOver) {
            return error({ code: ERRORS.DEVICE_DISCONNECTED_DURING_ACTION });
        }

        const packet = Buffer.alloc(this.chunkSize);
        buffer.copy(packet);
        const report = device.shouldPrependReportId
            ? Buffer.concat([UNNUMBERED_REPORT_ID, packet])
            : packet;

        try {
            const writtenLength = await this.trackTransfer(device, device.handle.write(report));
            this.logger?.debug(
                `hid: ${getShortPath(path)} wrote ${writtenLength} of ${report.length} bytes`,
            );
            if (!writtenLength) {
                return error({ code: ERRORS.INTERFACE_DATA_TRANSFER });
            }

            return success(undefined);
        } catch (err) {
            this.logger?.error(
                `hid: ${getShortPath(path)} write failed: ${this.describeError(err)}`,
            );

            return error({ code: ERRORS.INTERFACE_DATA_TRANSFER });
        }
    }

    public async closeDevice(
        ...[path]: AbstractApiArgs<'closeDevice'>
    ): Promise<AbstractApiAwaitedResult<'closeDevice'>> {
        const device = this.openedDevices.get(path);
        if (!device) {
            return success(undefined);
        }

        this.openedDevices.delete(path);
        device.readGeneration += 1;
        // The handle must not be closed while a transfer is in flight.
        await Promise.allSettled(Array.from(device.pendingTransfers));

        try {
            await device.handle.close();
            this.logger?.info(`hid: ${getShortPath(path)} closed`);

            return success(undefined);
        } catch (err) {
            this.logger?.error(
                `hid: ${getShortPath(path)} close failed: ${this.describeError(err)}`,
            );

            return error({ code: ERRORS.INTERFACE_UNABLE_TO_CLOSE_DEVICE });
        }
    }

    public dispose() {
        this.isDisposed = true;
        this.listening = false;
        Array.from(this.openedDevices.keys()).forEach(path => this.closeDevice(path));
    }
}
