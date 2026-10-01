/**
 * The WARD Manager: the external freshness authority. A port of the firmware tests' `MockWM`
 * (`tests/ward_wm.py`) and the WM half of `tests/ward_keys.py`, speaking attestation v6.
 *
 * `DevWm` signs with the DEBUG WM key, which ONLY emulator and debug firmware trust -- a release
 * build rejects every WM signature until a real key is provisioned. It stands in, behind the
 * `WmClient` interface, until the real WM (trezor-suite-sync) speaks v6.
 *
 * What a WM is: it holds each wallet's head `(counter, root)` and a HEAD NONCE rotated by every
 * transition it accepts; it compare-and-swaps an advance and verifies the device's `wm_sig` over
 * it; and on request it signs the step that reached the head, bound to the device's round nonce.
 * It is an authority on FRESHNESS and ORDERING only -- the device never takes a root on its word.
 */
import { ed25519 } from '@noble/curves/ed25519.js';
import { randomBytes } from '@noble/hashes/utils.js';

import { type BytesLike, concatBytes, equalBytes, toBytes, toHex, u32 } from './bytes';
import { EMPTY_ROOT } from './trie';

const ascii = (s: string) => new TextEncoder().encode(s);

export const TAG_COMMIT = ascii('WARD COMMIT v3');
export const TAG_REVERT = ascii('WARD REVERT v3');
export const TAG_WM_HEAD = ascii('WARD WM COMMIT v3');
export const TAG_WM_INIT = ascii('WARD WM INIT v3');
export const TAG_WM_REVERT = ascii('WARD WM REVERT v3');
const ATTEST_DOMAIN = ascii('WARD ATTEST v1');
const ATTEST_VERSION = 6;
/** The value `head_init_sig` is minted under -- NEVER a live head nonce. */
export const NO_HEAD_NONCE = new Uint8Array(32);
/** The well-known debug WM key the emulator and debug firmware trust. */
export const DEBUG_WM_SEED = ascii('AUTHDB QM DEBUG KEY SEED v1 ....');
/** Mirrors the firmware's `apps.ward.cas.MAX_BATCH`. */
export const MAX_BATCH = 8;

const rootOrEmpty = (root: Uint8Array | null | undefined) => root ?? EMPTY_ROOT;

const u64 = (n: number) => {
    const out = new Uint8Array(8);
    new DataView(out.buffer).setBigUint64(0, BigInt(n));

    return out;
};

/** len8(tag) || tag || ward_id || from_counter || from_root || to_counter || to_root */
export const transitionPreimage = (
    tag: Uint8Array,
    wardId: Uint8Array,
    fromCounter: number,
    fromRoot: Uint8Array | null | undefined,
    toCounter: number,
    toRoot: Uint8Array | null | undefined,
): Uint8Array =>
    concatBytes(
        Uint8Array.of(tag.length),
        tag,
        wardId,
        u32(fromCounter),
        rootOrEmpty(fromRoot),
        u32(toCounter),
        rootOrEmpty(toRoot),
    );

/** `transitionPreimage` plus the WM's current head nonce: what `wm_sig` covers. */
export const wmPreimage = (
    tag: Uint8Array,
    wardId: Uint8Array,
    fromCounter: number,
    fromRoot: Uint8Array | null | undefined,
    toCounter: number,
    toRoot: Uint8Array | null | undefined,
    headNonce: Uint8Array,
): Uint8Array =>
    concatBytes(
        transitionPreimage(tag, wardId, fromCounter, fromRoot, toCounter, toRoot),
        headNonce,
    );

/** Verify a device's `wm_sig` with `ward_id` alone -- which IS the Ed25519 public key. */
export const verifyWmSig = (
    wardId: Uint8Array,
    fromCounter: number,
    fromRoot: Uint8Array | null | undefined,
    toCounter: number,
    toRoot: Uint8Array | null | undefined,
    headNonce: Uint8Array,
    sig: Uint8Array,
    tag: Uint8Array = TAG_WM_HEAD,
): boolean => {
    try {
        return ed25519.verify(
            sig,
            wmPreimage(tag, wardId, fromCounter, fromRoot, toCounter, toRoot, headNonce),
            wardId,
        );
    } catch {
        return false;
    }
};

export interface Attestation {
    fromCounter: number;
    fromRoot: Uint8Array;
    fromHeadNonce: Uint8Array;
    toCounter: number;
    toRoot: Uint8Array;
    toHeadNonce: Uint8Array;
    timestamp: number;
    signature: Uint8Array;
}

/** The v6 attestation preimage: the transition OCCURRENCE, bound to the round nonce. */
export const attestationPreimage = (
    nonce: Uint8Array,
    wardId: Uint8Array,
    a: Omit<Attestation, 'signature'>,
): Uint8Array =>
    concatBytes(
        ATTEST_DOMAIN,
        Uint8Array.of(ATTEST_VERSION),
        nonce,
        wardId,
        u32(a.fromCounter),
        rootOrEmpty(a.fromRoot),
        a.fromHeadNonce,
        u32(a.toCounter),
        rootOrEmpty(a.toRoot),
        a.toHeadNonce,
        u64(a.timestamp),
    );

/** What wardd needs from a WM, whichever one it is. */
export interface WmClient {
    readonly pubkey: Uint8Array;
    /** Enrol a wallet at genesis (counter 0), authorised by the device's `head_init_sig`. */
    enrol(wardId: Uint8Array, root: Uint8Array | null, headInitSig: Uint8Array): Promise<void>;
    /** Sign the step that reached the current head, bound to the device's round nonce. */
    attest(wardId: Uint8Array, nonce: Uint8Array): Promise<Attestation>;
    /** Compare-and-swap an advance authorised by `wm_sig`; resolves to whether it was a revert. */
    advance(step: {
        wardId: Uint8Array;
        fromCounter: number;
        fromRoot: Uint8Array | null;
        toCounter: number;
        toRoot: Uint8Array | null;
        wmSig: Uint8Array;
        timestamp?: number;
    }): Promise<boolean>;
    headNonce(wardId: Uint8Array): Promise<Uint8Array | null>;
    /** The head it holds, or null if the wallet is not enrolled. A null root is the empty tree. */
    head(wardId: Uint8Array): Promise<{ counter: number; root: Uint8Array | null } | null>;
}

/** The WM's refusal: the head this transition was built on is not the head it holds. */
export class WmConflict extends Error {
    constructor(readonly headCounter: number) {
        super(`the WM head is at counter ${headCounter}`);
        this.name = 'WmConflict';
    }
}

interface HeadRecord {
    fromCounter: number;
    fromRoot: Uint8Array;
    counter: number;
    root: Uint8Array;
    timestamp: number;
    fromHeadNonce: Uint8Array;
    headNonce: Uint8Array;
}

/**
 * The in-process development WM. A head nonce that has ever been current is NEVER made current
 * again -- the one obligation a real WM carries -- and the ledger here enforces it.
 */
export class DevWm implements WmClient {
    readonly pubkey: Uint8Array;
    private heads = new Map<string, HeadRecord>();
    private retired = new Map<string, Set<string>>();

    constructor(
        private readonly seed: Uint8Array = DEBUG_WM_SEED,
        private readonly now: () => number = () => Math.floor(Date.now() / 1000),
    ) {
        this.pubkey = ed25519.getPublicKey(seed);
    }

    private draw(wardId: Uint8Array): Uint8Array {
        const ledger = this.retired.get(toHex(wardId)) ?? new Set<string>();
        this.retired.set(toHex(wardId), ledger);
        for (;;) {
            const nonce = randomBytes(32);
            if (!equalBytes(nonce, NO_HEAD_NONCE) && !ledger.has(toHex(nonce))) {
                ledger.add(toHex(nonce));

                return nonce;
            }
        }
    }

    record(wardId: BytesLike): HeadRecord | undefined {
        return this.heads.get(toHex(toBytes(wardId)));
    }

    enrol(wardId: Uint8Array, root: Uint8Array | null, headInitSig: Uint8Array): Promise<void> {
        const known = this.heads.get(toHex(wardId));
        if (known) return Promise.resolve();
        const preimage = wmPreimage(TAG_WM_INIT, wardId, 0, root, 0, root, NO_HEAD_NONCE);
        if (!ed25519.verify(headInitSig, preimage, wardId)) {
            return Promise.reject(new Error('head-init authorisation does not verify'));
        }
        // THE WM DRAWS N0 HERE: both ends of the genesis step carry it, since nothing was consumed.
        const n0 = this.draw(wardId);
        this.heads.set(toHex(wardId), {
            fromCounter: 0,
            fromRoot: rootOrEmpty(root),
            counter: 0,
            root: rootOrEmpty(root),
            timestamp: this.now(),
            fromHeadNonce: n0,
            headNonce: n0,
        });

        return Promise.resolve();
    }

    /** Sign arbitrary values -- for tests that model a hostile or broken WM. */
    sign(nonce: Uint8Array, wardId: Uint8Array, a: Omit<Attestation, 'signature'>): Uint8Array {
        return ed25519.sign(attestationPreimage(nonce, wardId, a), this.seed);
    }

    attest(wardId: Uint8Array, nonce: Uint8Array): Promise<Attestation> {
        const h = this.heads.get(toHex(wardId));
        if (!h) return Promise.reject(new Error('wallet is not enrolled with this WM'));
        const body = {
            fromCounter: h.fromCounter,
            fromRoot: h.fromRoot,
            fromHeadNonce: h.fromHeadNonce,
            toCounter: h.counter,
            toRoot: h.root,
            toHeadNonce: h.headNonce,
            timestamp: h.timestamp,
        };

        return Promise.resolve({ ...body, signature: this.sign(nonce, wardId, body) });
    }

    advance(step: Parameters<WmClient['advance']>[0]): Promise<boolean> {
        const h = this.heads.get(toHex(step.wardId));
        if (!h) return Promise.reject(new Error('wallet is not enrolled with this WM; sync first'));
        // COMPARE-AND-SWAP on the head it holds.
        if (h.counter !== step.fromCounter || !equalBytes(h.root, rootOrEmpty(step.fromRoot))) {
            return Promise.reject(new WmConflict(h.counter));
        }
        if (!(
            step.toCounter - step.fromCounter >= 1 && step.toCounter - step.fromCounter <= MAX_BATCH
        )) {
            return Promise.reject(new Error('a head advances by 1 to MAX_BATCH'));
        }
        const args = [
            step.wardId,
            step.fromCounter,
            step.fromRoot,
            step.toCounter,
            step.toRoot,
            h.headNonce,
            step.wmSig,
        ] as const;
        let isRevert: boolean;
        if (verifyWmSig(...args, TAG_WM_HEAD)) isRevert = false;
        else if (verifyWmSig(...args, TAG_WM_REVERT)) isRevert = true;
        else return Promise.reject(new Error('transition is not authorised by this wallet'));

        this.heads.set(toHex(step.wardId), {
            fromCounter: step.fromCounter,
            fromRoot: rootOrEmpty(step.fromRoot),
            counter: step.toCounter,
            root: rootOrEmpty(step.toRoot),
            timestamp: step.timestamp ?? this.now(),
            fromHeadNonce: h.headNonce,
            headNonce: this.draw(step.wardId),
        });

        return Promise.resolve(isRevert);
    }

    headNonce(wardId: Uint8Array): Promise<Uint8Array | null> {
        return Promise.resolve(this.heads.get(toHex(wardId))?.headNonce ?? null);
    }

    head(wardId: Uint8Array): Promise<{ counter: number; root: Uint8Array | null } | null> {
        const h = this.heads.get(toHex(wardId));

        return Promise.resolve(
            h ? { counter: h.counter, root: equalBytes(h.root, EMPTY_ROOT) ? null : h.root } : null,
        );
    }

    /**
     * The WM's whole state, for a daemon to persist. A restart that forgot it would be a WM SWAP to
     * every device that synced against it -- the head nonce they hold would no longer be current.
     * The ledger goes too: a retired nonce must stay retired across restarts.
     */
    snapshot(): DevWmSnapshot {
        const hex = (r: HeadRecord) => ({
            ...r,
            fromRoot: toHex(r.fromRoot),
            root: toHex(r.root),
            fromHeadNonce: toHex(r.fromHeadNonce),
            headNonce: toHex(r.headNonce),
        });

        return {
            heads: Object.fromEntries([...this.heads].map(([id, r]) => [id, hex(r)])),
            retired: Object.fromEntries([...this.retired].map(([id, set]) => [id, [...set]])),
        };
    }

    restore(snap: DevWmSnapshot): this {
        this.heads = new Map(
            Object.entries(snap.heads).map(([id, r]) => [
                id,
                {
                    ...r,
                    fromRoot: toBytes(r.fromRoot),
                    root: toBytes(r.root),
                    fromHeadNonce: toBytes(r.fromHeadNonce),
                    headNonce: toBytes(r.headNonce),
                },
            ]),
        );
        this.retired = new Map(Object.entries(snap.retired).map(([id, l]) => [id, new Set(l)]));

        return this;
    }
}

export interface DevWmSnapshot {
    heads: Record<
        string,
        {
            fromCounter: number;
            fromRoot: string;
            counter: number;
            root: string;
            timestamp: number;
            fromHeadNonce: string;
            headNonce: string;
        }
    >;
    retired: Record<string, string[]>;
}
