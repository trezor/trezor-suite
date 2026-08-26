import TrezorConnect from '../../../src';
import {
    emulatorModel,
    emulatorStartType,
    getController,
    initTrezorConnect,
    setup,
} from '../../common.setup';

// WARD is not in any released firmware; it lives in a trezor-firmware branch, and its multi-session
// THP parts need T3W1 (see packages/connect-cli/e2e/ward-queue.sh, which builds
// `--model t3w1 --debug-link`). So this arc only makes sense against an emulator started FROM A
// BRANCH on T3W1 -- every other matrix (released firmware, other models) has no WARD methods to call
// and skips gracefully. The WARD firmware lives on the trezor-firmware `petrsusil/ward-draft` branch;
// run it with:
//
//   ./docker/docker-connect-test.sh node -b petrsusil/ward-draft -m T3W1 -p ward
//
// See packages/connect/e2e/README.md.
const wardCapable =
    emulatorModel === 'T3W1' &&
    (emulatorStartType === 'emulator-start-from-branch' ||
        emulatorStartType === 'emulator-start-from-url');

// Protobuf `bytes` fields (identifier, value) cross the connect boundary as hex, exactly as the
// connect-cli does (`toHex` in packages/connect-cli/src/wardRunners.ts). `app_id` is a plain string.
const toHex = (value: string) => Buffer.from(value, 'utf8').toString('hex');

const controller = getController();

// The WARD store keys entries under the wallet, so the run needs an initialized (seeded) device, and
// it must start with NO pinned WARD app: the first WARD call pins THIS host, which is what the reset
// at the end then retires. `setup` wipes and re-seeds the emulator, so both hold.
(wardCapable ? describe : describe.skip)('TrezorConnect WARD queue', () => {
    const APP_ID = 'btc_app';
    // Mixed case on purpose: app_id/identifier are hashed into the entry key and must survive
    // verbatim -- a lowercased identifier derives a DIFFERENT key, which the case-sensitivity check
    // below relies on.
    const IDENTIFIER = toHex('Addr1');
    const VALUE = toHex('queued_secret');

    beforeAll(async () => {
        await setup(controller, { mnemonic: 'mnemonic_all' });
        await initTrezorConnect(controller);
    });

    afterAll(() => {
        controller.dispose();
        TrezorConnect.dispose();
    });

    // The offline queue arc, the half of WARD that depends on no backend: it reads and writes the
    // device's OWN store, so it can be exercised against a bare emulator with no service daemon (the
    // online reads/writes/flushes are covered by packages/connect-cli/e2e/ward-queue.sh, which stands
    // up a wardd stub).
    it('queues a change, reads it back, and discards it -- all offline', async () => {
        // 1. Hold a write on the device. The ack is empty: the value only reaches the tree on flush,
        //    so there is no leaf, counter or path to return yet.
        const queued = await TrezorConnect.wardQueueSetEntry({
            app_id: APP_ID,
            identifier: IDENTIFIER,
            value: VALUE,
        });
        expect(queued).toMatchObject({ success: true });

        // 2. The device holds it as a PENDING change and hands back the value plus a restore MAC (the
        //    MAC is what makes the record backupable without letting a host forge one).
        const got = await TrezorConnect.wardQueueGetEntry({
            app_id: APP_ID,
            identifier: IDENTIFIER,
        });
        expect(got).toMatchObject({ success: true, payload: { pending: true, value: VALUE } });
        if (!got.success) throw new Error(got.error.message);
        expect(got.payload.missing).toBeFalsy();
        expect(got.payload.mac).toBeTruthy();

        // 3. Case is significant: a lowercased identifier hashes to a different key, so the device
        //    honestly reports it missing rather than returning the entry above.
        const wrongCase = await TrezorConnect.wardQueueGetEntry({
            app_id: APP_ID,
            identifier: toHex('addr1'),
        });
        expect(wrongCase).toMatchObject({ success: true, payload: { missing: true } });

        // 4. Discard the queued change. This touches no trie -- the change was never published -- it
        //    just drops the pending record.
        const discarded = await TrezorConnect.wardQueueDeleteEntry({
            app_id: APP_ID,
            identifier: IDENTIFIER,
        });
        expect(discarded).toMatchObject({ success: true });
        if (!discarded.success) throw new Error(discarded.error.message);
        expect(discarded.payload.missing).toBeFalsy();

        // 5. And it is really gone.
        const gone = await TrezorConnect.wardQueueGetEntry({
            app_id: APP_ID,
            identifier: IDENTIFIER,
        });
        expect(gone).toMatchObject({ success: true, payload: { missing: true } });

        // 6. Discarding nothing is an answer, not a failure: a host reconciling its own view of the
        //    queue legitimately asks about a change that has already been published.
        const discardNothing = await TrezorConnect.wardQueueDeleteEntry({
            app_id: APP_ID,
            identifier: IDENTIFIER,
        });
        expect(discardNothing).toMatchObject({ success: true, payload: { missing: true } });
    });

    it('retires the pinned WARD app', async () => {
        // The queue arc above pinned this host as the WARD app on its first call (the device grants
        // the role to the first app that asks, on a held confirmation). Retiring it reports that a pin
        // was actually there to retire -- which success alone does not say.
        const reset = await TrezorConnect.wardResetApp({});
        expect(reset).toMatchObject({ success: true, payload: { was_bound: true } });
    });
});
