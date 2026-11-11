import { createSocket } from 'dgram';

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

    return {
        read: queue.read,
        write: async report => {
            const written = await device.nativeTransferOut(output.endpointNumber, 1000, report);
            if (written !== 64) throw new Error('WARD service short USB write');
        },
        close: async () => {
            closing = true;
            queue.fail(new Error('WARD service closed'));
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
