/**
 * The dev WM against the firmware tests' MockWM and ward_keys (vectors generated there), and its
 * behaviour as a WM: enrolment, attestation, compare-and-swap, both tags, the batch range.
 */
import { ed25519 } from '@noble/curves/ed25519.js';

import { toBytes, toHex } from '../bytes';
import {
    DEBUG_WM_SEED,
    DevWm,
    NO_HEAD_NONCE,
    TAG_WM_INIT,
    TAG_WM_REVERT,
    WmConflict,
    attestationPreimage,
    verifyWmSig,
    wmPreimage,
} from '../wm';
import vectors from './fixtures/vectors.json';

const { wm } = vectors;
const b = (v: string | null) => (v === null ? null : toBytes(v));

describe('DevWm conformance with MockWM', () => {
    it('uses the debug key the emulator trusts', () => {
        expect(toHex(DEBUG_WM_SEED)).toBe(wm.debug_seed);
        expect(toHex(new DevWm().pubkey)).toBe(wm.debug_pubkey);
    });

    it.each([
        ['a transition', wm.attest],
        ['genesis', wm.attest_genesis],
    ])('signs %s exactly as MockWM does', (_name, a) => {
        const body = {
            fromCounter: a.from_counter,
            fromRoot: b(a.from_root)!,
            fromHeadNonce: toBytes(a.from_head_nonce),
            toCounter: a.to_counter,
            toRoot: b(a.to_root)!,
            toHeadNonce: toBytes(a.to_head_nonce),
            timestamp: a.timestamp,
        };
        expect(toHex(new DevWm().sign(toBytes(a.nonce), toBytes(a.ward_id), body))).toBe(
            a.signature,
        );
    });

    it('verifies the wm_sig ward_keys mints, under the right tag only', () => {
        const id = toBytes(wm.ward_id);
        const c = wm.wm_sig_commit;
        const commitArgs = [
            id,
            c.from_counter,
            b(c.from_root),
            c.to_counter,
            b(c.to_root),
            toBytes(c.head_nonce),
            toBytes(c.sig),
        ] as const;
        expect(verifyWmSig(...commitArgs)).toBe(true);
        expect(verifyWmSig(...commitArgs, TAG_WM_REVERT)).toBe(false);
        const r = wm.wm_sig_revert;
        const revertArgs = [
            id,
            r.from_counter,
            b(r.from_root),
            r.to_counter,
            b(r.to_root),
            toBytes(r.head_nonce),
            toBytes(r.sig),
        ] as const;
        expect(verifyWmSig(...revertArgs, TAG_WM_REVERT)).toBe(true);
        expect(verifyWmSig(...revertArgs)).toBe(false);
    });

    it('accepts the head_init_sig ward_keys mints', () => {
        const id = toBytes(wm.ward_id);
        const pre = wmPreimage(TAG_WM_INIT, id, 0, null, 0, null, NO_HEAD_NONCE);
        expect(ed25519.verify(toBytes(wm.head_init.sig), pre, id)).toBe(true);
    });
});

describe('DevWm as a WM', () => {
    const kSig = toBytes(wm.k_sig);
    const wardId = toBytes(wm.ward_id);
    const r1 = new Uint8Array(32).fill(1);
    const r2 = new Uint8Array(32).fill(2);
    const headInit = ed25519.sign(
        wmPreimage(TAG_WM_INIT, wardId, 0, null, 0, null, NO_HEAD_NONCE),
        kSig,
    );
    const wmSig = (
        fc: number,
        fr: Uint8Array | null,
        tc: number,
        tr: Uint8Array,
        nonce: Uint8Array,
        tag?: Uint8Array,
    ) =>
        ed25519.sign(
            wmPreimage(
                tag ?? new TextEncoder().encode('WARD WM COMMIT v3'),
                wardId,
                fc,
                fr,
                tc,
                tr,
                nonce,
            ),
            kSig,
        );

    const enrolled = async () => {
        const dev = new DevWm(DEBUG_WM_SEED, () => 1_700_000_000);
        await dev.enrol(wardId, null, headInit);

        return dev;
    };

    it('enrols at genesis with one nonce at both ends, and attests against the round nonce', async () => {
        const dev = await enrolled();
        const a = await dev.attest(wardId, new Uint8Array(32).fill(7));
        expect([a.fromCounter, a.toCounter]).toEqual([0, 0]);
        expect(a.fromHeadNonce).toEqual(a.toHeadNonce);
        expect(
            ed25519.verify(
                a.signature,
                attestationPreimage(new Uint8Array(32).fill(7), wardId, a),
                dev.pubkey,
            ),
        ).toBe(true);
    });

    it('advances on a genuine wm_sig, rotates the nonce, and refuses a replay', async () => {
        const dev = await enrolled();
        const n0 = (await dev.headNonce(wardId))!;
        const sig = wmSig(0, null, 1, r1, n0);
        await expect(
            dev.advance({
                wardId,
                fromCounter: 0,
                fromRoot: null,
                toCounter: 1,
                toRoot: r1,
                wmSig: sig,
            }),
        ).resolves.toBe(false);
        const n1 = (await dev.headNonce(wardId))!;
        expect(n1).not.toEqual(n0);
        // the same authorisation again: the head moved, so compare-and-swap refuses it
        await expect(
            dev.advance({
                wardId,
                fromCounter: 0,
                fromRoot: null,
                toCounter: 1,
                toRoot: r1,
                wmSig: sig,
            }),
        ).rejects.toBeInstanceOf(WmConflict);
    });

    it('accepts a batch of up to MAX_BATCH and a revert, and refuses a forged step', async () => {
        const dev = await enrolled();
        let nonce = (await dev.headNonce(wardId))!;
        await dev.advance({
            wardId,
            fromCounter: 0,
            fromRoot: null,
            toCounter: 8,
            toRoot: r1,
            wmSig: wmSig(0, null, 8, r1, nonce),
        });
        nonce = (await dev.headNonce(wardId))!;
        await expect(
            dev.advance({
                wardId,
                fromCounter: 8,
                fromRoot: r1,
                toCounter: 9,
                toRoot: r2,
                wmSig: wmSig(8, r1, 9, r2, nonce, TAG_WM_REVERT),
            }),
        ).resolves.toBe(true);
        nonce = (await dev.headNonce(wardId))!;
        await expect(
            dev.advance({
                wardId,
                fromCounter: 9,
                fromRoot: r2,
                toCounter: 18,
                toRoot: r1,
                wmSig: wmSig(9, r2, 18, r1, nonce),
            }),
        ).rejects.toThrow('1 to MAX_BATCH');
        await expect(
            dev.advance({
                wardId,
                fromCounter: 9,
                fromRoot: r2,
                toCounter: 10,
                toRoot: r1,
                wmSig: new Uint8Array(64),
            }),
        ).rejects.toThrow('not authorised');
    });
});
