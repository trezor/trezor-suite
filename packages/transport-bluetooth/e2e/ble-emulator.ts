// Client of the BLE emulator control API, see e2e/docker/ble_emulator.py

const CONTROL_URL = process.env.MOCK_CONTROL_URL ?? 'http://127.0.0.1:21398/rpc';

export type PeripheralKind = 'trezor' | 'generic';

export type PeripheralParams = {
    id?: string;
    kind?: PeripheralKind;
    name?: string;
    address?: string;
    /** advertised manufacturer data (without company id) */
    manufacturerData?: number[];
    /** advertised 128-bit service UUIDs */
    serviceUuids?: string[];
    connectable?: boolean;
    /** start advertising immediately. default: true */
    advertising?: boolean;
    /** Trezor emulator UDP target "host:port"; null to echo GATT writes */
    udpTarget?: string | null;
};

export type PeripheralUpdate = Pick<
    PeripheralParams,
    'name' | 'manufacturerData' | 'serviceUuids' | 'connectable'
>;

export type PeripheralInfo = Required<Omit<PeripheralParams, 'advertising' | 'udpTarget'>> & {
    advertising: boolean;
    connected: boolean;
    pairing: { accept: boolean; delayMs: number };
};

export class BleEmulator {
    private async call<T>(method: string, params: Record<string, unknown> = {}): Promise<T> {
        const response = await fetch(CONTROL_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ method, params }),
        });
        const body = (await response.json()) as { result?: T; error?: string };
        if (body.error !== undefined) {
            throw new Error(`BLE emulator "${method}": ${body.error}`);
        }

        return body.result as T;
    }

    /**
     * Central powered on, only the default Trezor peripheral (id: "trezor").
     * forgetDevices: remove devices and bonds cached by BlueZ (the server notices after the next discovery).
     */
    reset({ forgetDevices = false }: { forgetDevices?: boolean } = {}) {
        return this.call<PeripheralInfo[]>('reset', { forgetDevices });
    }

    list() {
        return this.call<PeripheralInfo[]>('list_peripherals');
    }

    addPeripheral(params: PeripheralParams = {}) {
        return this.call<PeripheralInfo>('add_peripheral', params);
    }

    /** Peripheral disappears from the air, existing connections are dropped. */
    removePeripheral(id: string) {
        return this.call<void>('remove_peripheral', { id });
    }

    startAdvertising(id: string) {
        return this.call<PeripheralInfo>('start_advertising', { id });
    }

    stopAdvertising(id: string) {
        return this.call<PeripheralInfo>('stop_advertising', { id });
    }

    /** Changes advertisement data, advertising is restarted if running. */
    updatePeripheral(id: string, update: PeripheralUpdate) {
        return this.call<PeripheralInfo>('update_peripheral', { id, ...update });
    }

    /** Peripheral initiated disconnect. */
    disconnectPeripheral(id: string) {
        return this.call<void>('disconnect_peripheral', { id });
    }

    /** Numeric comparison pairing behavior of the peripheral. */
    setPairing(id: string, pairing: { accept?: boolean; delayMs?: number }) {
        return this.call<PeripheralInfo>('set_pairing', { id, ...pairing });
    }

    /** Waits until BlueZ creates the device object of the peripheral (requires an active scan). */
    waitForCentralDevice(id: string, timeoutMs = 10_000) {
        return this.call<void>('wait_central_device', { id, timeoutMs });
    }

    /** Peripheral forgets bonding keys. */
    forgetBonds(id: string) {
        return this.call<void>('forget_bonds', { id });
    }

    /** Powers the central (BlueZ adapter) on/off. */
    setCentralPower(enabled: boolean) {
        return this.call<void>('set_central_power', { enabled });
    }
}
