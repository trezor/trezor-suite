import dgram from 'node:dgram';

import { BleEmulator } from './ble-emulator';
import { createClient, waitForEvent } from './helpers';
import { TrezorBluetooth } from '../src/client/trezor-bluetooth';
import type { BluetoothDevice } from '../src/client/types';

const DEVICE_NAME = process.env.MOCK_PERIPHERAL_NAME ?? 'Trezor E2E';
const CONNECT_TIMEOUT = 30_000;
// the mock peripheral tunnels packets to this UDP port (MOCK_UDP_TARGET in docker-compose.yml)
const UDP_PORT = Number(process.env.MOCK_UDP_PORT ?? 21399);

const isMockTrezor = (device: BluetoothDevice) => device.name === DEVICE_NAME;

describe('trezor-bluetooth server', () => {
    let client: TrezorBluetooth;
    let deviceId: string;
    const udp = dgram.createSocket('udp4');

    beforeAll(async () => {
        await new Promise<void>(resolve => udp.bind(UDP_PORT, '127.0.0.1', resolve));
        await new BleEmulator().reset();
        client = createClient();
        await client.connect();
    });

    afterAll(async () => {
        await client.send('stop_scan').catch(() => {});
        client.disconnect();
        udp.close();
    });

    it('responds to ping and get_info', async () => {
        await expect(client.ping()).resolves.toBeUndefined();

        await expect(client.send('get_info')).resolves.toMatchObject({
            api_version: expect.any(String),
        });
    });

    it('starts scan and discovers the emulated Trezor', async () => {
        const { devices } = await client.send('start_scan');
        const device =
            devices.find(isMockTrezor) ??
            (
                await waitForEvent(client, 'device_discovered', event =>
                    event.devices.some(isMockTrezor),
                )
            ).devices.find(isMockTrezor);

        expect(device).toMatchObject({
            name: DEVICE_NAME,
            connected: false,
            // advertisement manufacturer data: pairing mode, color, model code
            data: [1, 0, 0],
        });
        deviceId = device!.id;
        await expect(client.send('get_info')).resolves.toMatchObject({ state: 'enabled' });
    });

    it('stops scan', async () => {
        await expect(client.send('stop_scan')).resolves.toEqual({ success: true });
    });

    it('connects the peripheral', async () => {
        const connected = waitForEvent(client, 'device_connected', ({ devices }) =>
            devices.some(device => device.id === deviceId),
        );

        await expect(
            client.send('connect_device', { id: deviceId, timeout: CONNECT_TIMEOUT }),
        ).resolves.toEqual({ success: true });

        const { devices } = await connected;
        expect(devices.find(device => device.id === deviceId)).toMatchObject({ connected: true });
    });

    it('tunnels characteristic writes to UDP and UDP replies to read notifications', async () => {
        const packet = Array.from({ length: 64 }, (_, index) => index);
        const received = new Promise<Buffer>(resolve => {
            udp.once('message', (message, remote) => {
                // emulator stub: reply with the reversed packet
                udp.send(Buffer.from(message).reverse(), remote.port, remote.address);
                resolve(message);
            });
        });
        const read = waitForEvent(
            client,
            'device_read',
            ({ id, characteristic }) => id === deviceId && characteristic === 'read',
        );

        await client.send('open_device', { id: deviceId });
        await client.send('write', { id: deviceId, data: packet });

        expect([...(await received)]).toEqual(packet);
        expect((await read).data).toEqual([...packet].reverse());

        await client.send('close_device', { id: deviceId });
    });

    it('disconnects the peripheral', async () => {
        const disconnected = waitForEvent(
            client,
            'device_disconnected',
            ({ id }) => id === deviceId,
        );

        await expect(client.send('disconnect_device', { id: deviceId })).resolves.toEqual({
            success: true,
        });

        await disconnected;
        const { devices } = await client.send('enumerate');
        expect(devices.find(device => device.id === deviceId)).toMatchObject({ connected: false });
    });
});
