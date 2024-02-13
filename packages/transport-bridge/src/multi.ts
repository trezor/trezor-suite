import { WebUSB } from 'usb';

import { v1 as protocolV1, bridge as protocolBridge } from '@trezor/protocol';

import { receive as receiveUtil } from '@trezor/transport/src/utils/receive';
import { SessionsBackground } from '@trezor/transport/src/sessions/background';
import { SessionsClient } from '@trezor/transport/src/sessions/client';
import { AbstractApi } from '@trezor/transport/src/api/abstract';
import { UsbApi } from '@trezor/transport/src/api/usb';
import { UdpApi } from '@trezor/transport/src/api/udp';

import { AbstractApiTransport } from '@trezor/transport/src/transports/abstractApi';

const writeUtil = async ({ api, path, data }: { api: AbstractApi; path: string; data: string }) => {
    const { typeId, buffer: restBuffer } = protocolBridge.decode(
        new Uint8Array(Buffer.from(data, 'hex')),
    );

    const buffers = protocolV1.encode(restBuffer, {
        messageType: typeId,
    });

    for (let i = 0; i < buffers.length; i++) {
        const bufferSegment = buffers[i];
        await api.write(path, bufferSegment);
    }
};

const readUtil = async ({ api, path }: { api: AbstractApi; path: string }) => {
    try {
        const message = await receiveUtil(
            () =>
                api.read(path).then(result => {
                    if (result.success) {
                        return result.payload;
                    }
                    throw new Error(result.error);
                }),
            protocolV1.decode,
        );
        return protocolBridge
            .encode(message.buffer, { messageType: message.typeId })[0]
            .toString('hex');
    } catch (err) {
        return { success: false as const, error: err.message };
    }
};

class BridgeAbstractApiTransport extends AbstractApiTransport {
    constructor({ api, sessions }: { api: AbstractApi; sessions: SessionsClient }) {
        super({ api, sessionsClient: sessions });
    }

    // todo: name doesn't make sense
    name = 'BridgeTransport' as const;

    // @ts-expect-error
    public async call({ session, data }: { session: string; data: string }) {
        console.log('call', session, data);
        const sessionsResult = await this.sessionsClient.getPathBySession({
            session,
        });

        console.log('call: sessionsResult', sessionsResult);
        if (!sessionsResult.success) {
            console.log('call: sessionsResult error', sessionsResult);
            return sessionsResult;
        }
        const { path } = sessionsResult.payload;
        console.log('call: openDevice');
        await this.api.openDevice(path, false);
        console.log('call: writeUtil');
        await writeUtil({ api: this.api, path, data });
        console.log('call: readUtil');
        const message = await readUtil({ api: this.api, path });
        return { success: true as const, payload: message };
    }

    // @ts-expect-error
    public async send({ session, data }: { session: string; data: string }) {
        const sessionsResult = await this.sessionsClient.getPathBySession({
            session,
        });

        if (!sessionsResult.success) {
            return sessionsResult;
        }
        const { path } = sessionsResult.payload;

        await this.api.openDevice(path, false);
        await writeUtil({ api: this.api, path, data });
        return { success: true as const };
    }

    // @ts-expect-error
    public async receive({ session }: { session: string }) {
        const sessionsResult = await this.sessionsClient.getPathBySession({
            session,
        });

        if (!sessionsResult.success) {
            return sessionsResult;
        }
        const { path } = sessionsResult.payload;

        await this.api.openDevice(path, false);

        const message = await readUtil({ api: this.api, path });

        return { success: true as const, payload: message };
    }
}

const sessionsBackgroundHw = new SessionsBackground();
const sessionsBackgroundEmu = new SessionsBackground();

const usbApi = new UsbApi({
    usbInterface: new WebUSB({
        allowAllDevices: true, // return all devices, not only authorized
    }),
});
const udpApi = new UdpApi({});

const sessionsClientHw = new SessionsClient({
    requestFn: args => sessionsBackgroundHw.handleMessage(args),
    registerBackgroundCallbacks: () => {},
});

const sessionsClientEmu = new SessionsClient({
    requestFn: args => sessionsBackgroundEmu.handleMessage(args),
    registerBackgroundCallbacks: () => {},
});

sessionsBackgroundHw.on('descriptors', descriptors => {
    sessionsClientHw.emit('descriptors', descriptors);
});
sessionsBackgroundEmu.on('descriptors', descriptors => {
    sessionsClientEmu.emit('descriptors', descriptors);
});

const bridgeUsbTransport = new BridgeAbstractApiTransport({
    api: usbApi,
    sessions: sessionsClientHw,
});
const bridgeUdpTransport = new BridgeAbstractApiTransport({
    api: udpApi,
    sessions: sessionsClientEmu,
});

class Transports {
    public transports: BridgeAbstractApiTransport[];

    constructor({ transports }: { transports: BridgeAbstractApiTransport[] }) {
        this.transports = transports;
    }

    // all
    listen() {
        this.transports.forEach(transport => {
            transport.listen();
        });
    }

    // all but in case of duplicate, do something? hmm?
    enumerate() {
        return Promise.all(this.transports.map(transport => transport.enumerate().promise)).then(
            results =>
                results.some(res => !res.success)
                    ? { success: false as const, error: res.error }
                    : results.reduce(
                          (acc, res) => {
                              acc.payload.descriptors = acc.payload.descriptors.concat(res.payload);
                              return acc;
                          },
                          { success: true, payload: { descriptors: [] } },
                      ),
        );
    }

    acquire({ input }: { input: { previous: string; path: string } }) {
        const transport = this.selectTransport(input.path);
        if (!transport) {
            return {
                promise: Promise.resolve({ success: false as const, error: 'Transport not found' }),
            };
        }
        return transport.acquire({
            input: {
                path: input.path,
                previous: input.previous === 'null' ? null : input.previous,
            },
        });
    }

    release({ session, path }: { session: string; path: string }) {
        const transport = this.selectTransport(path);
        if (!transport) {
            return {
                promise: Promise.resolve({ success: false as const, error: 'Transport not found' }),
            };
        }
        return transport.release({ session, path });
    }

    call({ session, data, path }: { session: string; data: string }) {
        const transport = this.selectTransport(path);
        if (!transport) {
            return {
                promise: Promise.resolve({ success: false as const, error: 'Transport not found' }),
            };
        }
        return { promise: transport.call({ session, data }) };
    }

    send({ session, data }: { session: string; data: string }) {
        const transport = this.selectTransport(path);
        if (!transport) {
            return {
                promise: Promise.resolve({ success: false as const, error: 'Transport not found' }),
            };
        }
        return { promise: transport.send({ session, data }) };
    }

    receive({ session }: { session: string }) {
        const transport = this.selectTransport(path);
        if (!transport) {
            return {
                promise: Promise.resolve({ success: false as const, error: 'Transport not found' }),
            };
        }
        return { promise: transport.receive({ session }) };
    }

    private selectTransport(path?: string) {
        const medium = path
            ? ['usb', 'udp', 'ble'].find(medium => path.split('-')[0] === medium)
            : 'usb';

        return this.transports.find(transport => transport.api.pathPrefix === medium);
    }
}

export const multiTransport = new Transports({
    transports: [bridgeUsbTransport, bridgeUdpTransport],
});
