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

/** Tells the devices served by `HidApi` apart from the ones of the usb apis. */
export const isHidPath = (path: PathInternal) => path.startsWith(HID_PATH_PREFIX);

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
// A continuation-like packet without a message header, which the firmware ignores.
const REPORT_ID_PROBE = Buffer.concat([Buffer.from('?'), Buffer.alloc(63, 0xff)]);

type HidHandle = {
    read: (timeout?: number) => Promise<Buffer | undefined>;
    write: (values: Buffer) => Promise<number>;
    close: () => Promise<void>;
};

/** Subset of the `node-hid` module used by `HidApi`. */
export type NodeHid = {
    devicesAsync: (vendorId: number, productId: number) => Promise<NodeHidDevice[]>;
    HIDAsync: { open: (path: string) => Promise<HidHandle> };
};

type OpenedDevice = {
    handle: HidHandle;
    shouldPrependReportId: boolean;
    // Bumped whenever the in-flight read has to give up: session takeover or close.
    readGeneration: number;
    pendingTransfers: Set<Promise<unknown>>;
};

type HidApiParams = Omit<AbstractApiConstructorParams, 'type'> & {
    nodeHid: NodeHid;
    platform?: NodeJS.Platform;
};

const isWireInterface = (device: NodeHidDevice) =>
    // hidapi reports interface -1 on macOS, there the usage page is the only reliable marker.
    device.interface === WIRE_INTERFACE || device.usagePage === WIRE_USAGE_PAGE;

// The system path identifies the USB port and must not leave the machine, so descriptors carry
// only its digest. trezord-go identified HID devices the same way.
const createPath = (systemPath: string) =>
    PathInternal(`${HID_PATH_PREFIX}${createHash('sha256').update(systemPath).digest('hex')}`);

/**
 * Talks to Trezor One devices that only expose a HID interface (firmware 1.6.3 and older).
 * Error messages from `node-hid` are never passed on, they can contain the system path.
 */
export class HidApi extends AbstractApi {
    chunkSize = 64;

    private readonly nodeHid: NodeHid;
    private readonly platform: NodeJS.Platform;
    private systemPaths = new Map<PathInternal, string>();
    private openedDevices = new Map<PathInternal, OpenedDevice>();

    constructor({ logger, nodeHid, platform = process.platform }: HidApiParams) {
        super({ logger, type: 'usb' });
        this.nodeHid = nodeHid;
        this.platform = platform;
    }

    public listen() {
        if (this.listening) return;
        this.listening = true;
        this.listenLoop();
    }

    // The node-hid library has no hotplug events.
    private async listenLoop() {
        while (this.listening) {
            await resolveAfter(ENUMERATE_INTERVAL);
            if (!this.listening) break;
            await this.enumerate();
        }
    }

    public async enumerate(..._args: AbstractApiArgs<'enumerate'>) {
        try {
            const devices = await this.nodeHid.devicesAsync(T1_HID_VENDOR, T1_HID_PRODUCT);
            const systemPaths = new Map<PathInternal, string>();
            devices.forEach(device => {
                if (device.path && isWireInterface(device)) {
                    systemPaths.set(createPath(device.path), device.path);
                }
            });
            this.handleDevicesChange(systemPaths);

            return success(this.getDescriptors());
        } catch {
            this.logger?.error('hid: enumerate failed');

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
                openedDevice.readGeneration += 1;
                await Promise.allSettled(Array.from(openedDevice.pendingTransfers));
                await this.discardQueuedReports(openedDevice);
            }

            return success(undefined);
        }

        const systemPath = this.systemPaths.get(path);
        if (!systemPath) {
            return error({ code: ERRORS.DEVICE_NOT_FOUND });
        }

        try {
            const handle = await this.nodeHid.HIDAsync.open(systemPath);
            const shouldPrependReportId = await this.detectReportIdPrepend(handle);
            if (shouldPrependReportId === undefined) {
                await handle.close().catch(() => {});

                return error({ code: ERRORS.INTERFACE_UNABLE_TO_OPEN_DEVICE });
            }
            this.openedDevices.set(path, {
                handle,
                shouldPrependReportId,
                readGeneration: 0,
                pendingTransfers: new Set(),
            });

            return success(undefined);
        } catch {
            this.logger?.error('hid: openDevice failed');

            return error({ code: ERRORS.INTERFACE_UNABLE_TO_OPEN_DEVICE });
        }
    }

    /**
     * Firmware up to 1.6.0 puts the wire packets on HID report 63, which is also the first byte of
     * every packet. Newer firmware uses an unnumbered report and Windows then requires a leading
     * zero report ID. The only way to tell them apart is to try, same as trezord-go did.
     */
    private async detectReportIdPrepend(handle: HidHandle) {
        if (this.platform !== 'win32') {
            return false;
        }

        const prependedProbe = Buffer.concat([UNNUMBERED_REPORT_ID, REPORT_ID_PROBE]);
        const prependedLength = await handle.write(prependedProbe).catch(() => undefined);
        if (prependedLength === prependedProbe.length) {
            return true;
        }

        const plainLength = await handle.write(REPORT_ID_PROBE).catch(() => undefined);
        if (plainLength === REPORT_ID_PROBE.length) {
            return false;
        }

        return undefined;
    }

    // A response the previous owner never read stays queued on the handle. The new owner would
    // take it for the answer to its first call.
    private async discardQueuedReports(device: OpenedDevice) {
        for (let discarded = 0; discarded < MAX_DISCARDED_REPORTS; discarded += 1) {
            const report = await this.trackTransfer(device, device.handle.read(READ_TIMEOUT)).catch(
                () => undefined,
            );
            if (!report?.length) return;
        }
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
                    return success(Buffer.from(report));
                }
            } catch {
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

        const packet = Buffer.alloc(this.chunkSize);
        buffer.copy(packet);
        const report = device.shouldPrependReportId
            ? Buffer.concat([UNNUMBERED_REPORT_ID, packet])
            : packet;

        try {
            const writtenLength = await this.trackTransfer(device, device.handle.write(report));
            if (!writtenLength) {
                return error({ code: ERRORS.INTERFACE_DATA_TRANSFER });
            }

            return success(undefined);
        } catch {
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

            return success(undefined);
        } catch {
            return error({ code: ERRORS.INTERFACE_UNABLE_TO_CLOSE_DEVICE });
        }
    }

    public dispose() {
        this.listening = false;
        Array.from(this.openedDevices.keys()).forEach(path => this.closeDevice(path));
    }
}
