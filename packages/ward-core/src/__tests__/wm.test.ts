/**
 * The dev WM against the firmware tests' MockWM and ward_keys (vectors generated there), and its
 * behaviour as a WM: enrolment, attestation, predecessor check, both tags, the batch range.
 */
import { ed25519 } from '@noble/curves/ed25519.js';

import { concatBytes, toBytes, toHex } from '../bytes';
import {
    DEBUG_WM_SEED,
    DevWm,
    TAG_WM_HEAD,
    TAG_WM_INIT,
    TAG_WM_REVERT,
    WmConflict,
    attestationPreimage,
    sessionOpenPreimage,
    transitionPreimage,
    verifyWmSig,
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
            toCounter: a.to_counter,
            toRoot: b(a.to_root)!,
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
            toBytes(c.sig),
        ] as const;
        const session = toBytes(wm.session);
        expect(verifyWmSig(...commitArgs, TAG_WM_HEAD, session)).toBe(true);
        // bound to the session: without it, or under another, it does not verify
        expect(verifyWmSig(...commitArgs)).toBe(false);
        expect(verifyWmSig(...commitArgs, TAG_WM_HEAD, new Uint8Array(32))).toBe(false);
        expect(verifyWmSig(...commitArgs, TAG_WM_REVERT, session)).toBe(false);
        const r = wm.wm_sig_revert;
        const revertArgs = [
            id,
            r.from_counter,
            b(r.from_root),
            r.to_counter,
            b(r.to_root),
            toBytes(r.sig),
        ] as const;
        expect(verifyWmSig(...revertArgs, TAG_WM_REVERT, session)).toBe(true);
        expect(verifyWmSig(...revertArgs, TAG_WM_HEAD, session)).toBe(false);
    });

    it('accepts the head_init_sig ward_keys mints', () => {
        const id = toBytes(wm.ward_id);
        const pre = transitionPreimage(TAG_WM_INIT, id, 0, null, 0, null);
        expect(ed25519.verify(toBytes(wm.head_init.sig), pre, id)).toBe(true);
    });
});

describe('DevWm as a WM', () => {
    const kSig = toBytes(wm.k_sig);
    const wardId = toBytes(wm.ward_id);
    const r1 = new Uint8Array(32).fill(1);
    const r2 = new Uint8Array(32).fill(2);
    const headInit = ed25519.sign(transitionPreimage(TAG_WM_INIT, wardId, 0, null, 0, null), kSig);
    // the round nonce the device picked for its latest sync: its WM session
    const session = new Uint8Array(32).fill(7);
    const wmSig = (
        fc: number,
        fr: Uint8Array | null,
        tc: number,
        tr: Uint8Array,
        tag: Uint8Array = TAG_WM_HEAD,
        nonce: Uint8Array = session,
    ) => ed25519.sign(concatBytes(transitionPreimage(tag, wardId, fc, fr, tc, tr), nonce), kSig);

    const open = async (dev: DevWm, nonce: Uint8Array) => {
        const proof = ed25519.sign(
            sessionOpenPreimage(wardId, await dev.challenge(wardId), nonce),
            kSig,
        );
        await dev.openSession(wardId, nonce, proof);

        return proof;
    };

    const enrolled = async () => {
        const dev = new DevWm(DEBUG_WM_SEED, () => 1_700_000_000);
        await dev.enrol(wardId, null, headInit);
        await open(dev, session);

        return dev;
    };

    it('consumes a session challenge once and keeps head reads independent of writes', async () => {
        const dev = await enrolled();
        const next = new Uint8Array(32).fill(8);
        const challenge = await dev.challenge(wardId);
        const proof = ed25519.sign(sessionOpenPreimage(wardId, challenge, next), kSig);
        await expect(dev.openSession(wardId, session, proof)).rejects.toThrow('invalid');
        const wrongKey = ed25519.sign(sessionOpenPreimage(wardId, challenge, next), r2);
        await expect(dev.openSession(wardId, next, wrongKey)).rejects.toThrow('invalid');
        await dev.openSession(wardId, next, proof);
        const before = await dev.challenge(wardId);
        await dev.attest(wardId, session);
        await expect(dev.openSession(wardId, next, proof)).rejects.toThrow('expired');
        expect(await dev.challenge(wardId)).toEqual(before);
        const step = { wardId, fromCounter: 0, fromRoot: null, toCounter: 1, toRoot: r1 };
        await expect(dev.advance({ ...step, wmSig: wmSig(0, null, 1, r1) })).rejects.toThrow(
            'not authorised',
        );
        await dev.advance({ ...step, wmSig: wmSig(0, null, 1, r1, TAG_WM_HEAD, next) });
        const pending = ed25519.sign(sessionOpenPreimage(wardId, before, session), kSig);
        dev.restore(dev.snapshot());
        await expect(dev.openSession(wardId, session, pending)).rejects.toThrow('expired');
    });

    it('enrols at genesis, and attests against the round nonce', async () => {
        const dev = await enrolled();
        const a = await dev.attest(wardId, new Uint8Array(32).fill(7));
        expect([a.fromCounter, a.toCounter]).toEqual([0, 0]);
        expect(a.fromRoot).toEqual(a.toRoot);
        expect(
            ed25519.verify(
                a.signature,
                attestationPreimage(new Uint8Array(32).fill(7), wardId, a),
                dev.pubkey,
            ),
        ).toBe(true);
    });

    it('dates each signature by its clock when signing, and keeps no time in the register', async () => {
        let now = 1_000;
        const dev = new DevWm(DEBUG_WM_SEED, () => now);
        await dev.enrol(wardId, null, headInit);
        await open(dev, session);
        const { acceptance } = await dev.advance({
            wardId,
            fromCounter: 0,
            fromRoot: null,
            toCounter: 1,
            toRoot: r1,
            wmSig: wmSig(0, null, 1, r1),
        });
        expect(acceptance.timestamp).toBe(1_000);

        now = 5_000;
        const later = await dev.attest(wardId, new Uint8Array(32).fill(9));
        expect([later.fromCounter, later.toCounter, later.timestamp]).toEqual([0, 1, 5_000]);
        expect(
            ed25519.verify(
                later.signature,
                attestationPreimage(new Uint8Array(32).fill(9), wardId, later),
                dev.pubkey,
            ),
        ).toBe(true);
        // the acceptance time survives only in the signed record, which wardd keeps
        expect(Object.values(dev.snapshot().heads)[0]).not.toHaveProperty('timestamp');
    });

    it('advances on a genuine wm_sig, and refuses a replay', async () => {
        const dev = await enrolled();
        const sig = wmSig(0, null, 1, r1);
        await expect(
            dev.advance({
                wardId,
                fromCounter: 0,
                fromRoot: null,
                toCounter: 1,
                toRoot: r1,
                wmSig: sig,
            }),
        ).resolves.toMatchObject({ revert: false });
        expect(await dev.head(wardId)).toEqual({ counter: 1, root: r1 });
        // the same authorisation again: the head moved, so the predecessor check refuses it
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

    it('carries several transitions in one session, and a new sync ends it', async () => {
        const dev = await enrolled();
        await dev.advance({
            wardId,
            fromCounter: 0,
            fromRoot: null,
            toCounter: 1,
            toRoot: r1,
            wmSig: wmSig(0, null, 1, r1),
        });
        const heldBack = wmSig(1, r1, 2, r2);
        await open(dev, new Uint8Array(32).fill(8)); // another sync
        await expect(
            dev.advance({
                wardId,
                fromCounter: 1,
                fromRoot: r1,
                toCounter: 2,
                toRoot: r2,
                wmSig: heldBack,
            }),
        ).rejects.toThrow('not authorised');
    });

    it('after a restore, refuses a stored wm_sig and takes the step signed again in a new session', async () => {
        const dev = await enrolled();
        const step = {
            wardId,
            fromCounter: 0,
            fromRoot: null,
            toCounter: 1,
            toRoot: r1,
            wmSig: wmSig(0, null, 1, r1),
        };
        const backup = dev.snapshot();
        await dev.advance(step);
        dev.restore(backup);

        // the session ended with the restore: the stored device signature is refused
        await expect(dev.advance(step)).rejects.toThrow('no session');
        // the device syncs again, and signs the same step again under its new nonce
        const fresh = new Uint8Array(32).fill(9);
        await open(dev, fresh);
        await expect(dev.advance(step)).rejects.toThrow('not authorised');
        await expect(
            dev.advance({ ...step, wmSig: wmSig(0, null, 1, r1, TAG_WM_HEAD, fresh) }),
        ).resolves.toMatchObject({ revert: false });
        expect(await dev.head(wardId)).toEqual({ counter: 1, root: r1 });
    });

    it('says when a refused advance names a session that has ended (diagnostics only)', async () => {
        const dev = await enrolled();
        const step = {
            wardId,
            fromCounter: 0,
            fromRoot: null,
            toCounter: 1,
            toRoot: r1,
            wmSig: wmSig(0, null, 1, r1),
        };
        await open(dev, new Uint8Array(32).fill(8)); // another sync
        await expect(dev.advance({ ...step, session })).rejects.toThrow(
            'the session it names has ended',
        );
        // a claimed session is never trusted: naming the current one does not help
        await expect(dev.advance({ ...step, session: new Uint8Array(32).fill(8) })).rejects.toThrow(
            /^transition is not authorised by this wallet$/,
        );
    });

    it('accepts a batch of up to MAX_BATCH and a revert, and refuses a forged step', async () => {
        const dev = await enrolled();
        await dev.advance({
            wardId,
            fromCounter: 0,
            fromRoot: null,
            toCounter: 8,
            toRoot: r1,
            wmSig: wmSig(0, null, 8, r1),
        });
        await expect(
            dev.advance({
                wardId,
                fromCounter: 8,
                fromRoot: r1,
                toCounter: 9,
                toRoot: r2,
                wmSig: wmSig(8, r1, 9, r2, TAG_WM_REVERT),
            }),
        ).resolves.toMatchObject({ revert: true });
        await expect(
            dev.advance({
                wardId,
                fromCounter: 9,
                fromRoot: r2,
                toCounter: 18,
                toRoot: r1,
                wmSig: wmSig(9, r2, 18, r1),
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
