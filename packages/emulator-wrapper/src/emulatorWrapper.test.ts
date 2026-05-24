import dgram from 'node:dgram';

import { EmulatorWrapper } from './emulatorWrapper';

const PING = Buffer.from('PINGPING');
const PONG = Buffer.from('PONGPONG');
const LOCALHOST = '127.0.0.1';

interface FakeEmulator {
    socket: dgram.Socket;
    port: number;
    received: Buffer[];
}

const startFakeEmulator = (responder: (msg: Buffer) => Buffer | undefined): Promise<FakeEmulator> =>
    new Promise((resolve, reject) => {
        const socket = dgram.createSocket('udp4');
        const received: Buffer[] = [];
        socket.on('message', (message, info) => {
            received.push(Buffer.from(message));
            const reply = responder(message);
            if (reply) {
                socket.send(reply, info.port, info.address);
            }
        });
        socket.once('error', reject);
        socket.once('listening', () => {
            socket.removeListener('error', reject);
            resolve({ socket, port: socket.address().port, received });
        });
        socket.bind(0, LOCALHOST);
    });

const closeSocket = (socket: dgram.Socket) =>
    new Promise<void>(resolve => {
        socket.close(() => resolve());
    });

const sendAndReceive = (
    clientSocket: dgram.Socket,
    payload: Buffer,
    targetPort: number,
    timeoutMs: number,
): Promise<Buffer> =>
    new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            clientSocket.removeAllListeners('message');
            reject(new Error(`timed out after ${timeoutMs}ms`));
        }, timeoutMs);
        clientSocket.once('message', message => {
            clearTimeout(timer);
            resolve(Buffer.from(message));
        });
        clientSocket.send(payload, targetPort, LOCALHOST, error => {
            if (error) {
                clearTimeout(timer);
                clientSocket.removeAllListeners('message');
                reject(error);
            }
        });
    });

const createBoundClient = (): Promise<dgram.Socket> =>
    new Promise((resolve, reject) => {
        const socket = dgram.createSocket('udp4');
        socket.once('error', reject);
        socket.once('listening', () => {
            socket.removeListener('error', reject);
            resolve(socket);
        });
        socket.bind(0, LOCALHOST);
    });

describe('EmulatorWrapper (pass-through)', () => {
    let mainEmulator: FakeEmulator | undefined;
    let debugEmulator: FakeEmulator | undefined;
    let wrapper: EmulatorWrapper | undefined;
    let clients: dgram.Socket[] = [];

    afterEach(async () => {
        await wrapper?.stop();
        wrapper = undefined;
        await Promise.all(clients.map(closeSocket));
        clients = [];
        if (mainEmulator) await closeSocket(mainEmulator.socket);
        if (debugEmulator) await closeSocket(debugEmulator.socket);
        mainEmulator = undefined;
        debugEmulator = undefined;
    });

    it('forwards PINGPING to the emulator and PONGPONG back to the client', async () => {
        mainEmulator = await startFakeEmulator(msg => (msg.equals(PING) ? PONG : undefined));
        wrapper = new EmulatorWrapper({
            main: { listenPort: 0, targetHost: LOCALHOST, targetPort: mainEmulator.port },
        });
        await wrapper.start();
        const [endpoint] = wrapper.getEndpoints();
        const client = await createBoundClient();
        clients.push(client);

        const reply = await sendAndReceive(client, PING, endpoint.listenPort, 1000);

        expect(reply.equals(PONG)).toBe(true);
        expect(mainEmulator.received).toHaveLength(1);
        expect(mainEmulator.received[0].equals(PING)).toBe(true);
    });

    it('preserves arbitrary protobuf-shaped chunks byte-for-byte in both directions', async () => {
        const request = Buffer.alloc(64);
        request[0] = 0x3f;
        request[1] = 0x23;
        request[2] = 0x23;
        request.writeUInt16BE(0x002a, 3);
        request.writeUInt32BE(0x00000004, 5);
        Buffer.from('cafe', 'hex').copy(request, 9);
        const response = Buffer.alloc(64);
        response[0] = 0x3f;
        response[1] = 0x23;
        response[2] = 0x23;
        response.writeUInt16BE(0x002b, 3);
        Buffer.from('deadbeef', 'hex').copy(response, 9);

        mainEmulator = await startFakeEmulator(msg => (msg.equals(request) ? response : undefined));
        wrapper = new EmulatorWrapper({
            main: { listenPort: 0, targetHost: LOCALHOST, targetPort: mainEmulator.port },
        });
        await wrapper.start();
        const [endpoint] = wrapper.getEndpoints();
        const client = await createBoundClient();
        clients.push(client);

        const reply = await sendAndReceive(client, request, endpoint.listenPort, 1000);

        expect(reply.equals(response)).toBe(true);
        expect(mainEmulator.received[0].equals(request)).toBe(true);
    });

    it('routes main and debug endpoints independently to their own emulator ports', async () => {
        const MAIN_TAG = Buffer.from('main-reply');
        const DEBUG_TAG = Buffer.from('debug-reply');
        mainEmulator = await startFakeEmulator(() => MAIN_TAG);
        debugEmulator = await startFakeEmulator(() => DEBUG_TAG);

        wrapper = new EmulatorWrapper({
            main: { listenPort: 0, targetHost: LOCALHOST, targetPort: mainEmulator.port },
            debug: { listenPort: 0, targetHost: LOCALHOST, targetPort: debugEmulator.port },
        });
        await wrapper.start();
        const [mainEndpoint, debugEndpoint] = wrapper.getEndpoints();

        const mainClient = await createBoundClient();
        const debugClient = await createBoundClient();
        clients.push(mainClient, debugClient);

        const mainReply = await sendAndReceive(mainClient, PING, mainEndpoint.listenPort, 1000);
        const debugReply = await sendAndReceive(debugClient, PING, debugEndpoint.listenPort, 1000);

        expect(mainReply.equals(MAIN_TAG)).toBe(true);
        expect(debugReply.equals(DEBUG_TAG)).toBe(true);
    });

    it('returns the actual bound port when listenPort is 0', async () => {
        mainEmulator = await startFakeEmulator(() => PONG);
        wrapper = new EmulatorWrapper({
            main: { listenPort: 0, targetHost: LOCALHOST, targetPort: mainEmulator.port },
        });
        await wrapper.start();
        const [endpoint] = wrapper.getEndpoints();

        expect(endpoint.listenPort).toBeGreaterThan(0);
        expect(endpoint.targetPort).toBe(mainEmulator.port);
    });

    it('rejects start() when called twice without stop()', async () => {
        mainEmulator = await startFakeEmulator(() => PONG);
        wrapper = new EmulatorWrapper({
            main: { listenPort: 0, targetHost: LOCALHOST, targetPort: mainEmulator.port },
        });
        await wrapper.start();

        await expect(wrapper.start()).rejects.toThrow(/already running/);
    });
});
