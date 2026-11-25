/**
 * The WARD Manager: the external freshness authority. A port of the firmware tests' `MockWM`
 * (`tests/ward_wm.py`) and the WM half of `tests/ward_keys.py`, speaking attestation v7.
 *
 * `DevWm` signs with the DEBUG WM key, which ONLY emulator and debug firmware trust -- a release
 * build rejects every WM signature until a real key is provisioned. It stands in, behind the
 * `WmClient` interface, until the real WM (trezor-suite-sync) speaks v7.
 *
 * What a WM is: it holds each wallet's head `(counter, root)`; it compare-and-swaps an advance and
 * verifies the device's `wm_sig` over it; and on request it signs the step that reached the head,
 * bound to the device's round nonce. It is an authority on FRESHNESS and ORDERING only -- the
 * device never takes a root on its word.
 *
 * SESSIONS. A device's `wm_sig` is bound to the round nonce it picked for its latest sync -- the
 * WM never picks one. The WM installs it when a device signs the current opening challenge,
 * and accepts an authorisation only when it is bound to that nonce and its predecessor is the
 * head; one session can carry several transitions. The session nonce is volatile: a restore drops
 * it, so a restored WM takes none of the device signatures minted before. What it had accepted
 * comes back by ROLL-FORWARD THROUGH A TREZOR: wardd feeds a device the transitions with the WM's
 * signed record of each (`WardRollForward`); the device verifies both its own `auth_commit` and
 * the WM's record, and signs each step again for the current session. They then arrive here as
 * ordinary advances -- the WM accepts nothing but device-signed advances
 * (docs/ward/ward_transitions.md in the firmware).
 */
import { ed25519 } from '@noble/curves/ed25519.js';

import { type BytesLike, concatBytes, equalBytes, toBytes, toHex, u32 } from './bytes';
import { EMPTY_ROOT } from './trie';

const ascii = (s: string) => new TextEncoder().encode(s);

export const TAG_COMMIT = ascii('WARD COMMIT v3');
export const TAG_REVERT = ascii('WARD REVERT v3');
export const TAG_WM_HEAD = ascii('WARD WM COMMIT v5');
export const TAG_WM_INIT = ascii('WARD WM INIT v4');
export const TAG_WM_REVERT = ascii('WARD WM REVERT v5');
/** Without a WM (firmware built `--ward-without-wm`): the step signed for the HOST. */
export const TAG_STEP = ascii('WARD STEP v2');
const ATTEST_DOMAIN = ascii('WARD ATTEST v1');
const ATTEST_VERSION = 7;
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

/**
 * Verify a device's `wm_sig` with `ward_id` alone -- which IS the Ed25519 public key -- against the
 * session nonce it is bound to. Enrolment (TAG_WM_INIT) and the MVP's host step (TAG_STEP) carry
 * none.
 */
export const verifyWmSig = (
    wardId: Uint8Array,
    fromCounter: number,
    fromRoot: Uint8Array | null | undefined,
    toCounter: number,
    toRoot: Uint8Array | null | undefined,
    sig: Uint8Array,
    tag: Uint8Array = TAG_WM_HEAD,
    sessionNonce: Uint8Array = new Uint8Array(0),
): boolean => {
    try {
        return ed25519.verify(
            sig,
            concatBytes(
                transitionPreimage(tag, wardId, fromCounter, fromRoot, toCounter, toRoot),
                sessionNonce,
            ),
            wardId,
        );
    } catch {
        return false;
    }
};

export const sessionOpenPreimage = (wardId: Uint8Array, challenge: Uint8Array, nonce: Uint8Array) =>
    concatBytes(ascii('WARD SESSION OPEN v1'), wardId, challenge, nonce);

export interface Attestation {
    fromCounter: number;
    fromRoot: Uint8Array;
    toCounter: number;
    toRoot: Uint8Array;
    timestamp: number;
    signature: Uint8Array;
}

/** The v7 attestation preimage: the transition, bound to the round nonce. */
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
        u32(a.toCounter),
        rootOrEmpty(a.toRoot),
        u64(a.timestamp),
    );

/**
 * The WM's own signed record that it accepted a transition: an attestation of the step, under the
 * session nonce the device's authorisation was bound to. What roll-forward feeds a Trezor.
 */
export interface Acceptance extends Attestation {
    nonce: Uint8Array;
}

/** What wardd needs from a WM, whichever one it is. */
export interface WmClient {
    readonly pubkey: Uint8Array;
    /** Enrol a wallet at genesis (counter 0), authorised by the device's `head_init_sig`. */
    enrol(wardId: Uint8Array, root: Uint8Array | null, headInitSig: Uint8Array): Promise<void>;
    challenge(wardId: Uint8Array): Promise<Uint8Array>;
    openSession(wardId: Uint8Array, nonce: Uint8Array, proof: Uint8Array): Promise<Attestation>;
    /** Sign the current head for a freshness check, preserving the active write session. */
    attest(wardId: Uint8Array, nonce: Uint8Array): Promise<Attestation>;
    /**
     * Compare-and-swap an advance whose `wm_sig` is bound to the session nonce, timestamp it at the
     * WM, and return whether it was a revert with the WM's signed record of it.
     */
    advance(step: {
        wardId: Uint8Array;
        fromCounter: number;
        fromRoot: Uint8Array | null;
        toCounter: number;
        toRoot: Uint8Array | null;
        wmSig: Uint8Array;
        /**
         * The session nonce the host believes is current. DIAGNOSTICS ONLY: the WM verifies
         * against the nonce it holds, and this only explains a refusal.
         */
        session?: Uint8Array;
    }): Promise<{ revert: boolean; acceptance: Acceptance }>;
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
}

/** The in-process development WM. */
export class DevWm implements WmClient {
    readonly pubkey: Uint8Array;
    private heads = new Map<string, HeadRecord>();
    /** the round nonce of each wallet's latest sync; volatile, never in a snapshot */
    private sessions = new Map<string, Uint8Array>();

    // An unenrolled wallet needs a challenge too. Reads allocate no per-wallet state.
    private initialChallenge = crypto.getRandomValues(new Uint8Array(32));
    private challenges = new Map<string, Uint8Array>();

    constructor(
        private readonly seed: Uint8Array = DEBUG_WM_SEED,
        private readonly now: () => number = () => Math.floor(Date.now() / 1000),
    ) {
        this.pubkey = ed25519.getPublicKey(seed);
    }

    record(wardId: BytesLike): HeadRecord | undefined {
        return this.heads.get(toHex(toBytes(wardId)));
    }

    enrol(wardId: Uint8Array, root: Uint8Array | null, headInitSig: Uint8Array): Promise<void> {
        const known = this.heads.get(toHex(wardId));
        if (known) return Promise.resolve();
        if (!verifyWmSig(wardId, 0, root, 0, root, headInitSig, TAG_WM_INIT)) {
            return Promise.reject(new Error('head-init authorisation does not verify'));
        }
        // Genesis attests itself: both ends are the enrolled head.
        this.heads.set(toHex(wardId), {
            fromCounter: 0,
            fromRoot: rootOrEmpty(root),
            counter: 0,
            root: rootOrEmpty(root),
            timestamp: this.now(),
        });

        return Promise.resolve();
    }

    /** Sign arbitrary values -- for tests that model a hostile or broken WM. */
    sign(nonce: Uint8Array, wardId: Uint8Array, a: Omit<Attestation, 'signature'>): Uint8Array {
        return ed25519.sign(attestationPreimage(nonce, wardId, a), this.seed);
    }

    challenge(wardId: Uint8Array): Promise<Uint8Array> {
        return Promise.resolve(
            (this.challenges.get(toHex(wardId)) ?? this.initialChallenge).slice(),
        );
    }

    openSession(wardId: Uint8Array, nonce: Uint8Array, proof: Uint8Array): Promise<Attestation> {
        const id = toHex(wardId);
        const head = this.heads.get(id);
        if (!head) return Promise.reject(new Error('wallet is not enrolled with this WM'));
        const challenge = this.challenges.get(id) ?? this.initialChallenge;
        if (
            nonce.length !== 32 ||
            proof.length !== 64 ||
            !ed25519.verify(proof, sessionOpenPreimage(wardId, challenge, nonce), wardId)
        ) {
            return Promise.reject(new Error('invalid or expired session proof; sync again'));
        }
        // No await between proof verification, consuming the challenge and replacing the session.
        const att = this.signHead(wardId, head, nonce);
        this.challenges.set(id, crypto.getRandomValues(new Uint8Array(32)));
        this.sessions.set(id, nonce.slice());

        return Promise.resolve(att);
    }

    attest(wardId: Uint8Array, nonce: Uint8Array): Promise<Attestation> {
        const h = this.heads.get(toHex(wardId));
        if (!h) return Promise.reject(new Error('wallet is not enrolled with this WM'));
        if (nonce.length !== 32) return Promise.reject(new Error('invalid attestation nonce'));

        return Promise.resolve(this.signHead(wardId, h, nonce));
    }

    private signHead(wardId: Uint8Array, h: HeadRecord, nonce: Uint8Array): Acceptance {
        const body = {
            fromCounter: h.fromCounter,
            fromRoot: h.fromRoot,
            toCounter: h.counter,
            toRoot: h.root,
            timestamp: h.timestamp,
        };

        return { ...body, signature: this.sign(nonce, wardId, body), nonce };
    }

    advance(step: Parameters<WmClient['advance']>[0]): ReturnType<WmClient['advance']> {
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
        const session = this.sessions.get(toHex(step.wardId));
        if (!session) return Promise.reject(new Error('no session for this wallet; sync first'));
        const args = [
            step.wardId,
            step.fromCounter,
            step.fromRoot,
            step.toCounter,
            step.toRoot,
            step.wmSig,
        ] as const;
        let revert: boolean;
        if (verifyWmSig(...args, TAG_WM_HEAD, session)) revert = false;
        else if (verifyWmSig(...args, TAG_WM_REVERT, session)) revert = true;
        else if (step.session && !equalBytes(step.session, session)) {
            return Promise.reject(
                new Error(
                    'transition is not authorised by this wallet: the session it names has ended',
                ),
            );
        } else return Promise.reject(new Error('transition is not authorised by this wallet'));

        const head = {
            fromCounter: step.fromCounter,
            fromRoot: rootOrEmpty(step.fromRoot),
            counter: step.toCounter,
            root: rootOrEmpty(step.toRoot),
            timestamp: this.now(),
        };
        this.heads.set(toHex(step.wardId), head);

        return Promise.resolve({ revert, acceptance: this.signHead(step.wardId, head, session) });
    }

    head(wardId: Uint8Array): Promise<{ counter: number; root: Uint8Array | null } | null> {
        const h = this.heads.get(toHex(wardId));

        return Promise.resolve(
            h ? { counter: h.counter, root: equalBytes(h.root, EMPTY_ROOT) ? null : h.root } : null,
        );
    }

    /**
     * The WM's whole state, for a daemon to persist. A restart that forgot it would put every
     * wallet's register back, which is the one thing a WM must never do.
     */
    snapshot(): DevWmSnapshot {
        const hex = (r: HeadRecord) => ({
            fromCounter: r.fromCounter,
            fromRoot: toHex(r.fromRoot),
            counter: r.counter,
            root: toHex(r.root),
            timestamp: r.timestamp,
        });

        return { heads: Object.fromEntries([...this.heads].map(([id, r]) => [id, hex(r)])) };
    }

    /**
     * Load a snapshot. Sessions are volatile and end here. Fields older snapshots carried (head
     * nonces, a nonce ledger) are ignored.
     */
    restore(snap: DevWmSnapshot): this {
        this.initialChallenge = crypto.getRandomValues(new Uint8Array(32));
        this.challenges.clear();
        this.sessions.clear();
        this.heads = new Map(
            Object.entries(snap.heads).map(([id, r]) => [
                id,
                {
                    fromCounter: r.fromCounter,
                    fromRoot: toBytes(r.fromRoot),
                    counter: r.counter,
                    root: toBytes(r.root),
                    timestamp: r.timestamp,
                },
            ]),
        );

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
        }
    >;
}
