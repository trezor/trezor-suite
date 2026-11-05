import { InMemoryWardDb } from '@trezor/ward';
import { Wardd } from '@trezor/wardd/src/service';
import { MockWm } from '@trezor/wardd/src/wm';

import TrezorConnect from '../../../src';
import {
    emulatorModel,
    emulatorStartType,
    getController,
    initTrezorConnect,
    setup,
} from '../../common.setup';

// WARD is not in any released firmware; it lives in the trezor-firmware `petrsusil/ward-poc-encrypted`
// branch. So this arc only makes sense against an emulator started FROM A BRANCH -- every other
// matrix (released firmware) has no WARD messages and skips. It also needs wardd in the same
// process as Connect's core (the `wardd` setting is an object, not a message), so it runs in the
// node environment only. Run it with:
//
//   ./docker/docker-connect-test.sh node -b petrsusil/ward-poc-encrypted -m T3T1 -p ward
//
// See packages/connect-core/e2e/README.md. Ported from mroz22's arc for the ward-draft offline queue.
const wardCapable =
    emulatorModel !== 'T1B1' &&
    (emulatorStartType === 'emulator-start-from-branch' ||
        emulatorStartType === 'emulator-start-from-url') &&
    typeof window === 'undefined';

const controller = getController();

// One wallet, one wardd: a stateful arc, not a methods fixture, because the fixture runner wipes the
// device between methods and every step here builds on the tree the previous one left.
(wardCapable ? describe : describe.skip)('TrezorConnect WARD through wardd', () => {
    const APP_ID = 'btc_app';
    const ADDRESS = 'bc1qwardconnect';
    const NETWORK = 'btc';

    beforeAll(async () => {
        await setup(controller, { mnemonic: 'mnemonic_all' });
        await initTrezorConnect(controller);
        // wardd in-process: a fresh store and the debug WM (debug firmware only). Connect relays.
        await TrezorConnect.updateConnectSettings({
            wardd: new Wardd({ storage: new InMemoryWardDb(), wm: new MockWm() }),
        });
    });

    afterAll(() => {
        controller.dispose();
        TrezorConnect.dispose();
    });

    it('writes, proves, updates and deletes an entry', async () => {
        // 1. Sync: the WM attests wardd's (empty) head and the device adopts it.
        const synced = await TrezorConnect.wardInit({});
        expect(synced).toMatchObject({ success: true, payload: { counter: 0, root: '' } });

        // 2. Insert: the user confirms, the device pulls the empty-tree proof and seals the leaf.
        const inserted = await TrezorConnect.wardUpdate({
            appId: APP_ID,
            address: ADDRESS,
            networkSymbol: NETWORK,
            metadata: { label: 'first' },
        });
        expect(inserted).toMatchObject({ success: true, payload: { counter: 1 } });

        // 3. The device proves membership against its root, and wardd returns the stored label.
        const found = await TrezorConnect.wardLookup({
            appId: APP_ID,
            address: ADDRESS,
            networkSymbol: NETWORK,
        });
        expect(found).toMatchObject({
            success: true,
            payload: { valid: true, isMember: true, metadata: { label: 'first' } },
        });

        // 4. An absent address: a device-proven non-membership, served from wardd's witness.
        const absent = await TrezorConnect.wardVerify({
            appId: APP_ID,
            address: 'bc1qnotthere',
            networkSymbol: NETWORK,
        });
        expect(absent).toMatchObject({ success: true, payload: { valid: true, isMember: false } });

        // 5. Update: the device pulls the membership proof of the old leaf.
        const updated = await TrezorConnect.wardUpdate({
            appId: APP_ID,
            address: ADDRESS,
            networkSymbol: NETWORK,
            metadata: { label: 'second' },
        });
        expect(updated).toMatchObject({ success: true, payload: { counter: 2 } });

        // 6. The label shows on the device's own address screen.
        const shown = await TrezorConnect.wardDisplayAddress({
            appId: APP_ID,
            address: ADDRESS,
            networkSymbol: NETWORK,
        });
        expect(shown).toMatchObject({ success: true, payload: { shown: true } });

        // 7. Delete empties the tree, and the absence is then proven on the device.
        const deleted = await TrezorConnect.wardUpdate({
            appId: APP_ID,
            address: ADDRESS,
            networkSymbol: NETWORK,
            metadata: {},
            delete: true,
        });
        expect(deleted).toMatchObject({ success: true, payload: { counter: 3, root: '' } });

        const gone = await TrezorConnect.wardVerify({
            appId: APP_ID,
            address: ADDRESS,
            networkSymbol: NETWORK,
        });
        expect(gone).toMatchObject({ success: true, payload: { valid: true, isMember: false } });
    });
});
