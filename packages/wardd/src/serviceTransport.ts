import { createSocket } from 'dgram';
// WORKAROUND(usb@3.2.1): only cancelPendingRead needs the device type.
import type { UsbDevice } from 'usb/index';

export class ServiceTimeout extends Error {
    constructor() {
        super('WARD service timed out');
    }
}

export type ServiceTransport = {
    read: (timeout: number) => Promise<Buffer>;
    write: (report: Buffer) => Promise<void>;
    close: () => Promise<void>;
};

// node-usb cannot cancel an expired transfer: it stays submitted and swallows the next report.
// Keep one native read outstanding for the whole session and time reads out in JS instead.
const NATIVE_READ_TIMEOUT = 0x7fffffff;

// WORKAROUND(usb@3.2.1) begin: revert this whole commit after upgrading to usb >= 3.3.0.
//
// usb@3.2.1 cannot close a session while the native read above is still pending:
// 1. releaseInterface() and close() need an exclusive borrow of the native device, but the
//    pending nativeTransferIn() holds a shared one, so both are refused ("cannot be borrowed
//    mutably while another borrow is active"). clearHalt() is the only call that cancels the
//    read with a shared borrow. It also sends CLEAR_FEATURE(ENDPOINT_HALT), which the firmware
//    handles by resetting the endpoint's data toggle only.
// 2. Once clearHalt() has cancelled the read, the endpoint worker thread blocks waiting for its
//    next command before it performs the clear, so that clearHalt() never settles by itself.
//    Another clearHalt() wakes the worker, which then answers every queued one.
// usb@3.3.0 ("Fix active transfer close and release cleanup") lets releaseInterface() and
// close() run during a transfer and cancel it, so the plain release in close() suffices there.
// 3.3.0 was published on 2026-11-08 and is held back only by the 14-day npmMinimalAgeGate.
const WAKE_INTERVAL = 50;
const WAKE_ATTEMPTS = 20;

const cancelPendingRead = async (
    device: Pick<UsbDevice, 'clearHalt'>,
    endpointNumber: number,
    reader: Promise<void>,
) => {
    const first = device.clearHalt('in', endpointNumber);
    let parked = true;
    first.then(
        () => (parked = false),
        () => (parked = false),
    );
    const clears = [first];
    // The first clearHalt() cancels the read at once, ending the reader.
    await reader;
    for (let attempt = 0; parked && attempt < WAKE_ATTEMPTS; attempt++) {
        clears.push(device.clearHalt('in', endpointNumber));
        await new Promise(resolve => setTimeout(resolve, WAKE_INTERVAL));
    }
    // Each clearHalt() borrows the device until it settles, so releasing must wait for all.
    await Promise.allSettled(clears);
};
// WORKAROUND(usb@3.2.1) end

const createReportQueue = () => {
    const reports: Buffer[] = [];
    let failure: Error | undefined;
    let pending: ((report: Buffer | Error) => void) | undefined;
    const fail = (error: Error) => {
        failure = error;
        pending?.(error);
    };

    return {
        failure: () => failure,
        fail,
        push: (report: Buffer) => {
            if (failure) return;
            if (reports.length >= 1024) {
                fail(new Error('WARD service excessive reports'));
            } else if (pending) {
                pending(report);
            } else {
                reports.push(report);
            }
        },
        read: (timeout: number): Promise<Buffer> => {
            if (failure) return Promise.reject(failure);
            const report = reports.shift();
            if (report) return Promise.resolve(report);
            if (pending) return Promise.reject(new Error('Concurrent WARD service read'));

            return new Promise((resolve, reject) => {
                const timer = setTimeout(() => pending?.(new ServiceTimeout()), timeout);
                pending = result => {
                    clearTimeout(timer);
                    pending = undefined;
                    if (result instanceof Error) reject(result);
                    else resolve(result);
                };
            });
        },
    };
};

export const openServiceTransport = async (devicePath: string): Promise<ServiceTransport> => {
    if (devicePath.startsWith('udp:')) {
        const match = /^udp:([^:]+):(\d+)$/.exec(devicePath);
        const port = Number(match?.[2]);
        if (!match || !Number.isInteger(port) || port < 1 || port > 65528) {
            throw new Error('Use udp:HOST:WALLET_PORT for the WARD service');
        }
        const socket = createSocket('udp4');
        const queue = createReportQueue();
        socket.on('error', () => queue.fail(new Error('WARD service UDP connection failed')));
        socket.on('message', report => {
            if (report.length !== 64) {
                queue.fail(new Error('WARD service invalid UDP report'));
            } else {
                queue.push(report);
            }
        });
        try {
            await new Promise<void>((resolve, reject) => {
                socket.once('error', reject);
                socket.connect(port + 7, match[1], () => {
                    socket.removeListener('error', reject);
                    resolve();
                });
            });
        } catch {
            socket.close();
            throw new Error('WARD service UDP connection failed');
        }

        return {
            read: queue.read,
            write: report =>
                new Promise((resolve, reject) => {
                    const failure = queue.failure();
                    if (failure) return reject(failure);
                    socket.send(report, error => (error ? reject(error) : resolve()));
                }),
            close: () => {
                queue.fail(new Error('WARD service closed'));

                return new Promise(resolve => socket.close(resolve));
            },
        };
    }
    if (devicePath !== 'usb' && !devicePath.startsWith('usb:')) {
        throw new Error('Use usb, usb:SERIAL or udp:HOST:WALLET_PORT for the WARD service');
    }
    // Loading wardd without this option must not load a native USB addon.
    const { WebUSB } = await import('usb');
    const usb = new WebUSB({ allowAllDevices: true });
    const serial = devicePath === 'usb' ? undefined : devicePath.slice(4);
    if (serial === '') throw new Error('WARD service USB serial must not be empty');
    const devices = await usb.getDevices();
    const matches = devices.flatMap(device => {
        if (device.vendorId !== 0x1209 || (serial && device.serialNumber !== serial)) return [];

        return device.configurations.flatMap(configuration =>
            configuration.interfaces.flatMap(iface =>
                iface.alternates
                    .filter(
                        alternate =>
                            alternate.interfaceClass === 0xff &&
                            alternate.interfaceSubclass === 0x57 &&
                            alternate.interfaceProtocol === 1,
                    )
                    .map(alternate => ({ device, configuration, iface, alternate })),
            ),
        );
    });
    if (matches.length !== 1) {
        throw new Error('WARD service needs exactly one matching USB device; use usb:SERIAL');
    }
    const { device, configuration, iface, alternate } = matches[0]!;
    const input = alternate.endpoints.find(endpoint => endpoint.direction === 'in');
    const output = alternate.endpoints.find(endpoint => endpoint.direction === 'out');
    if (!input || !output || input.packetSize !== 64 || output.packetSize !== 64) {
        throw new Error('WARD service requires 64-byte USB endpoints');
    }
    await device.open();
    try {
        // Selecting the already active configuration would reset the wallet interface.
        if (device.configuration?.configurationValue !== configuration.configurationValue) {
            await device.selectConfiguration(configuration.configurationValue);
        }
        await device.claimInterface(iface.interfaceNumber);
        if (iface.alternate.alternateSetting !== alternate.alternateSetting) {
            await device.selectAlternateInterface(
                iface.interfaceNumber,
                alternate.alternateSetting,
            );
        }
    } catch {
        await device.close();
        throw new Error('Could not claim the WARD service USB interface');
    }

    const queue = createReportQueue();
    let closing = false;
    const reader = (async () => {
        while (!closing) {
            let data: Uint8Array | null;
            try {
                data = await device.nativeTransferIn(input.endpointNumber, NATIVE_READ_TIMEOUT, 64);
            } catch {
                // Do not attach native errors: they may contain device identifiers.
                if (!closing) queue.fail(new Error('WARD service USB read failed'));

                return;
            }
            if (data?.length !== 64) {
                queue.fail(new Error('WARD service short USB report'));

                return;
            }
            queue.push(Buffer.from(data));
        }
    })();
    // WORKAROUND(usb@3.2.1): close() must know whether a native read is still pending.
    let reading = true;
    reader.then(() => (reading = false));

    return {
        read: queue.read,
        write: async report => {
            const written = await device.nativeTransferOut(output.endpointNumber, 1000, report);
            if (written !== 64) throw new Error('WARD service short USB write');
        },
        close: async () => {
            closing = true;
            queue.fail(new Error('WARD service closed'));
            // WORKAROUND(usb@3.2.1): its release cannot cancel the read; see cancelPendingRead.
            if (reading) await cancelPendingRead(device, input.endpointNumber, reader);
            try {
                // Releasing the interface cancels the outstanding read.
                await device.releaseInterface(iface.interfaceNumber);
            } finally {
                await device.close();
            }
            await reader;
        },
    };
};
