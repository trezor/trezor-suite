import { BleEmulator } from './ble-emulator';
import { createClient, wait, waitForEvent } from './helpers';
import type { BluetoothDevice, DeviceConnectionStatus } from '../src/client/types';

const TREZOR_ID = 'trezor';
const TREZOR_NAME = process.env.MOCK_PERIPHERAL_NAME ?? 'Trezor E2E';
const CONNECT_TIMEOUT = 30_000;

const isTrezor = (device: BluetoothDevice) => device.name === TREZOR_NAME;

describe('trezor-bluetooth scenarios controlled by the BLE emulator', () => {
    const emulator = new BleEmulator();
    let client: ReturnType<typeof createClient>;

    // waitForBluez: after BlueZ cache cleanup the server reports a stale device until BlueZ discovers it again
    const scanAndFindTrezor = async ({ waitForBluez = false } = {}) => {
        const { devices } = await client.send('start_scan');
        if (waitForBluez) {
            await emulator.waitForCentralDevice(TREZOR_ID);
        }

        const device =
            devices.find(isTrezor) ??
            (
                await waitForEvent(client, 'device_discovered', event =>
                    event.devices.some(isTrezor),
                )
            ).devices.find(isTrezor);

        return device!;
    };

    const collectStatuses = () => {
        const statuses: DeviceConnectionStatus[] = [];
        const listener = ({ device }: { device: BluetoothDevice }) => {
            statuses.push(device.connectionStatus);
        };
        client.on('device_connection_status', listener);

        return { statuses, stop: () => client.off('device_connection_status', listener) };
    };

    beforeAll(async () => {
        client = createClient();
        await client.connect();
    });

    beforeEach(async () => {
        await emulator.reset();
    });

    afterEach(async () => {
        await client.send('stop_scan').catch(() => {});
    });

    afterAll(() => {
        client.disconnect();
    });

    it('does not list serviceless peripherals', async () => {
        await emulator.addPeripheral({ id: 'plain', kind: 'generic', name: 'Plain BLE' });

        await scanAndFindTrezor();
        await wait(1000);

        const { devices } = await client.send('enumerate');
        expect(devices.map(device => device.name)).not.toContain('Plain BLE');
    });

    it('discovers a Trezor which starts advertising during the scan', async () => {
        await client.send('start_scan');

        const discovered = waitForEvent(client, 'device_discovered', event =>
            event.devices.some(device => device.name === 'Late Trezor'),
        );
        await emulator.addPeripheral({ id: 'late', name: 'Late Trezor' });

        await expect(discovered).resolves.toBeDefined();
    });

    it('reports changed advertisement data', async () => {
        const device = await scanAndFindTrezor();
        expect(device.data).toEqual([1, 0, 0]);

        const updated = waitForEvent(client, 'device_updated', event =>
            event.devices.some(item => isTrezor(item) && item.data.join() === '0,1,2'),
        );
        await emulator.updatePeripheral(TREZOR_ID, { manufacturerData: [0, 1, 2] });

        await expect(updated).resolves.toBeDefined();
    });

    it('reports the disabled adapter and recovers when it is enabled again', async () => {
        await scanAndFindTrezor();
        await client.send('stop_scan');

        const disabled = waitForEvent(
            client,
            'adapter_state_changed',
            ({ state }) => state === 'disabled',
        );
        await emulator.setCentralPower(false);
        await disabled;

        await expect(client.send('start_scan')).rejects.toThrow();

        const enabled = waitForEvent(
            client,
            'adapter_state_changed',
            ({ state }) => state === 'enabled',
        );
        await emulator.setCentralPower(true);
        await enabled;

        await expect(client.send('start_scan')).resolves.toHaveProperty('devices');
    });

    describe('pairing', () => {
        beforeEach(async () => {
            await emulator.reset({ forgetDevices: true });
        });

        it('reports the pairing PIN', async () => {
            const { statuses, stop } = collectStatuses();
            const device = await scanAndFindTrezor({ waitForBluez: true });

            await client.send('connect_device', { id: device.id, timeout: CONNECT_TIMEOUT });
            stop();

            expect(statuses).toContainEqual({
                type: 'pairing',
                pin: expect.stringMatching(/^\d{6}$/),
            });
            expect(statuses.at(-1)).toEqual({ type: 'connected' });
        });
    });

    describe('connection failures', () => {
        it('reports disconnect initiated by the peripheral', async () => {
            const device = await scanAndFindTrezor();
            await client.send('connect_device', { id: device.id, timeout: CONNECT_TIMEOUT });

            const disconnected = waitForEvent(
                client,
                'device_disconnected',
                ({ id }) => id === device.id,
            );
            await emulator.disconnectPeripheral(TREZOR_ID);

            await expect(disconnected).resolves.toBeDefined();
        });

        it('reports a peripheral which disappears while connected', async () => {
            const device = await scanAndFindTrezor();
            await client.send('connect_device', { id: device.id, timeout: CONNECT_TIMEOUT });

            const disconnected = waitForEvent(
                client,
                'device_disconnected',
                ({ id }) => id === device.id,
            );
            await emulator.removePeripheral(TREZOR_ID);

            await expect(disconnected).resolves.toBeDefined();
        });

        it('can be cancelled when the peripheral is not connectable', async () => {
            const device = await scanAndFindTrezor();
            await emulator.updatePeripheral(TREZOR_ID, { connectable: false });

            const connecting = client.send('connect_device', {
                id: device.id,
                timeout: CONNECT_TIMEOUT,
            });
            const outcome = connecting.then(
                () => 'connected',
                () => 'failed',
            );
            await wait(2000);
            await client.send('disconnect_device', { id: device.id });

            await expect(outcome).resolves.toBe('failed');
        });
    });

    // keep last: the server keeps reporting the pairing-error status of the device afterwards
    describe('pairing rejection', () => {
        beforeEach(async () => {
            await emulator.reset({ forgetDevices: true });
        });

        it('fails when the peripheral rejects pairing', async () => {
            await emulator.setPairing(TREZOR_ID, { accept: false });
            const { statuses, stop } = collectStatuses();
            const device = await scanAndFindTrezor({ waitForBluez: true });

            await expect(
                client.send('connect_device', { id: device.id, timeout: CONNECT_TIMEOUT }),
            ).rejects.toThrow();
            stop();

            expect(statuses).toContainEqual(expect.objectContaining({ type: 'pairing-error' }));
        });
    });
});
