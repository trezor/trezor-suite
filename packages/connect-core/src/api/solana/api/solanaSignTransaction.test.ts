import { UI_EVENTS } from '@trezor/connect-common';

import SolanaSignTransaction from './solanaSignTransaction';
import type { Device } from '../../../device/Device';

// Copied from the signing fixtures of @trezor/network-solana: a v0 transfer of 1_000_000 lamports
// and its v1 form with a config priority fee of 12_345 lamports and ignored ComputeBudget
// instructions.
const v0Message =
    '8001000103e7f64154f14373a327aa566574e7250d23f68cb1025f3f4fa7fbc23ea0cc7b0fefebc5a5c00a736483b0273c00926e64a17121016b248b05c73f7468bd2138ac0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001020200010c0200000040420f000000000000';
const v1Message =
    '810100020700000000000000000000000000000000000000000000000000000000000000000000000304e7f64154f14373a327aa566574e7250d23f68cb1025f3f4fa7fbc23ea0cc7b0fefebc5a5c00a736483b0273c00926e64a17121016b248b05c73f7468bd2138ac00000000000000000000000000000000000000000000000000000000000000000306466fe5211732ffecadba72c39be7bc8ce5bbc5f7126b2c439b3a400000003930000000000000400d0300030009000300050002020c000340420f000000000002e093040000010200000040420f0000000000';
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

    it('precomposes a v1 transaction with the priority fee from its config', async () => {
        const { precomposed } = await createMethod(v1Message).getMethodInfo();

        expect(precomposed).toMatchObject({
            outputs: [
                { address: 'H9YxYwVaQkK5aMZDmYc99vGDu9UEXK2FVsDLrUkEzLAX', amount: '1000000' },
            ],
            fee: '17345',
            totalSpent: '1017345',
        });
    });
});
