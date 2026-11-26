import { UI_EVENTS } from '@trezor/connect-common';

import { v0Message, v1Message } from './__fixtures__/solanaMessages';
import SolanaSignTransaction from './solanaSignTransaction';
import type { Device } from '../../../device/Device';

const serializedV1Tx = `${v1Message}${'00'.repeat(64)}`;

const createMethod = (serializedTx: string) =>
    new SolanaSignTransaction({
        payload: {
            method: 'solanaSignTransaction',
            path: "m/44'/501'/0'/0'",
            serializedTx,
        },
    } as any);

const createDevice = (version: [number, number, number]) =>
    ({
        features: {
            internal_model: 'T3T1',
            major_version: version[0],
            minor_version: version[1],
            patch_version: version[2],
        },
        firmwareStatus: 'valid',
        isBootloader: () => false,
        isSeedless: () => false,
        getVersion: () => version,
    }) as unknown as Device;

const checkFirmwareRange = (serializedTx: string, version: [number, number, number]) => {
    const method = createMethod(serializedTx);
    method.setDevice(createDevice(version));

    return method.checkFirmwareRange();
};

describe('SolanaSignTransaction', () => {
    it('requires a firmware update for a v1 transaction on firmware without v1 support', () => {
        expect(checkFirmwareRange(serializedV1Tx, [2, 13, 0])).toBe(UI_EVENTS.FIRMWARE_OLD);
    });

    it('accepts a v1 transaction on firmware with v1 support', () => {
        expect(checkFirmwareRange(serializedV1Tx, [2, 13, 1])).toBeUndefined();
    });

    it('does not require v1 support for a v0 transaction', () => {
        expect(checkFirmwareRange(v0Message, [2, 13, 0])).toBeUndefined();
    });
});
