/**
 * High-level authenticated-labeling store for Suite (mirrors
 * `python/src/trezorlib/authlabel.py::LabelStore`).
 *
 * Holds the local trie plus the current `(counter, mac)` and drives the three
 * device calls. Trie proof bytes are `Uint8Array`; the connect messages carry
 * `bytes` as hex strings, so we convert at the boundary.
 *
 * The three device calls are injected (`AuthLabelConnect`) so this module does
 * not depend on the exact public-API typing of `@trezor/connect`.
 */
import { Trie, fromHex, keyHash, provesExistence, toHex } from './trie';
import type { TrieProof } from './trie';

export enum AuthLabelKeyType {
    XPUB = 1,
    NPUB = 2,
    UID = 3,
    EVM_ADDRESS = 4,
    ADDRESS = 5,
}

export enum AuthLabelChangeKind {
    ADD = 1,
    UPDATE = 2,
    DELETE = 3,
}

// wire (hex) shapes
interface WireProof {
    leaf?: { key_hash: string; label_type: number; label_value: string; counter: number };
    branch?: { prefix: string; prefix_bits: number; child_hash_0: string; child_hash_1: string };
    path: { prefix: string; prefix_bits: number; sibling_hash: string }[];
    empty?: boolean;
}

const proofToWire = (p: TrieProof): WireProof => ({
    empty: p.empty,
    leaf: p.leaf && {
        key_hash: toHex(p.leaf.key_hash),
        label_type: p.leaf.label_type,
        label_value: toHex(p.leaf.label_value),
        counter: p.leaf.counter,
    },
    branch: p.branch && {
        prefix: toHex(p.branch.prefix),
        prefix_bits: p.branch.prefix_bits,
        child_hash_0: toHex(p.branch.child_hash_0),
        child_hash_1: toHex(p.branch.child_hash_1),
    },
    path: p.path.map(s => ({
        prefix: toHex(s.prefix),
        prefix_bits: s.prefix_bits,
        sibling_hash: toHex(s.sibling_hash),
    })),
});

const strToBytes = (s: string) => new TextEncoder().encode(s);

type Ok<T> = { success: true; payload: T };
type Err = { success: false; payload: { error: string } };
type Result<T> = Ok<T> | Err;

export interface AuthLabelState {
    counter: number;
    empty_root_mac: string;
    wallet_id: string;
}
export interface AuthLabelShowAck {
    exists: boolean;
    label_type?: number;
    label_value?: string;
}
export interface AuthLabelChangeAck {
    new_root: string;
    new_counter: number;
    new_mac: string;
}

/** The three device calls, injected so we can wire `@trezor/connect` in the view. */
export interface AuthLabelConnect {
    authLabelGetState(params: { device?: unknown }): Promise<Result<AuthLabelState>>;
    authLabelShow(params: {
        device?: unknown;
        key_type: number;
        key_bytes: string;
        proof: WireProof;
        mac: string;
    }): Promise<Result<AuthLabelShowAck>>;
    authLabelChange(params: {
        device?: unknown;
        kind: number;
        key_type: number;
        key_bytes: string;
        proof: WireProof;
        mac?: string;
        new_label_type?: number;
        new_label_value?: string;
    }): Promise<Result<AuthLabelChangeAck>>;
}

export class LabelStore {
    trie = new Trie();
    counter = 0;
    mac = '';
    walletId = '';

    constructor(
        private readonly connect: AuthLabelConnect,
        private readonly device?: unknown,
    ) {}

    async bootstrap() {
        const res = await this.connect.authLabelGetState({ device: this.device });
        if (!res.success) throw new Error(res.payload.error);
        this.counter = res.payload.counter;
        this.mac = res.payload.empty_root_mac;
        this.walletId = res.payload.wallet_id;
        this.trie = new Trie();
    }

    async show(keyType: AuthLabelKeyType, keyBytes: Uint8Array): Promise<AuthLabelShowAck> {
        const kh = keyHash(keyType, keyBytes);
        const proof = this.trie.proof(kh);
        const res = await this.connect.authLabelShow({
            device: this.device,
            key_type: keyType,
            key_bytes: toHex(keyBytes),
            proof: proofToWire(proof),
            mac: this.mac,
        });
        if (!res.success) throw new Error(res.payload.error);

        return res.payload;
    }

    private async change(
        kind: AuthLabelChangeKind,
        keyType: AuthLabelKeyType,
        keyBytes: Uint8Array,
        newLabel?: string,
    ) {
        const kh = keyHash(keyType, keyBytes);
        const proof = this.trie.proof(kh);
        const res = await this.connect.authLabelChange({
            device: this.device,
            kind,
            key_type: keyType,
            key_bytes: toHex(keyBytes),
            proof: proofToWire(proof),
            mac: this.mac,
            new_label_type: newLabel !== undefined ? 1 : undefined,
            new_label_value: newLabel !== undefined ? toHex(strToBytes(newLabel)) : undefined,
        });
        if (!res.success) throw new Error(res.payload.error);
        const ack = res.payload;

        // mirror the change locally, then check the device agreed on the root
        if (kind === AuthLabelChangeKind.DELETE) this.trie.delete(kh);
        else this.trie.set(kh, 1, strToBytes(newLabel ?? ''), ack.new_counter);
        if (toHex(this.trie.root()) !== ack.new_root) {
            throw new Error('host/device root mismatch');
        }
        this.counter = ack.new_counter;
        this.mac = ack.new_mac;

        return ack;
    }

    add(keyType: AuthLabelKeyType, keyBytes: Uint8Array, label: string) {
        return this.change(AuthLabelChangeKind.ADD, keyType, keyBytes, label);
    }

    update(keyType: AuthLabelKeyType, keyBytes: Uint8Array, label: string) {
        return this.change(AuthLabelChangeKind.UPDATE, keyType, keyBytes, label);
    }

    delete(keyType: AuthLabelKeyType, keyBytes: Uint8Array) {
        return this.change(AuthLabelChangeKind.DELETE, keyType, keyBytes);
    }

    /** Wire-shaped proof for a key, for callers that talk to the device directly. */
    proofFor(keyType: AuthLabelKeyType, keyBytes: Uint8Array) {
        return proofToWire(this.trie.proof(keyHash(keyType, keyBytes)));
    }

    /** Does the local trie currently hold a label for this key? */
    hasLocal(keyType: AuthLabelKeyType, keyBytes: Uint8Array) {
        const kh = keyHash(keyType, keyBytes);

        return provesExistence(this.trie.proof(kh), kh);
    }

    /**
     * Serialisable form of everything needed to talk to the device again after a
     * restart. Restoring this is NOT optional: `authLabelGetState` returns the MAC of
     * the EMPTY root at the current counter, so a device happily accepts an empty
     * trie — meaning a `bootstrap()` on every load would silently discard the user's
     * contacts with no error anywhere.
     */
    snapshot(): LabelStoreSnapshot {
        return {
            entries: this.trie.allEntries().map(e => ({
                keyHash: toHex(e.keyHash),
                labelType: e.labelType,
                value: toHex(e.value),
                counter: e.counter,
            })),
            counter: this.counter,
            mac: this.mac,
            walletId: this.walletId,
        };
    }

    static fromSnapshot(connect: AuthLabelConnect, snapshot: LabelStoreSnapshot, device?: unknown) {
        const store = new LabelStore(connect, device);
        store.trie = Trie.fromEntries(
            snapshot.entries.map(e => ({
                keyHash: fromHex(e.keyHash),
                labelType: e.labelType,
                value: fromHex(e.value),
                counter: e.counter,
            })),
        );
        store.counter = snapshot.counter;
        store.mac = snapshot.mac;
        store.walletId = snapshot.walletId;

        return store;
    }

    /**
     * Confirms the restored snapshot still matches the device: same wallet, same
     * counter. A wallet mismatch means the record belongs to a different seed or
     * passphrase and must be discarded rather than presented to the device.
     */
    async verifyAgainstDevice(): Promise<'ok' | 'wallet-mismatch' | 'stale'> {
        const res = await this.connect.authLabelGetState({ device: this.device });
        if (!res.success) throw new Error(res.payload.error);
        if (this.walletId && res.payload.wallet_id !== this.walletId) return 'wallet-mismatch';
        if (res.payload.counter !== this.counter) return 'stale';

        return 'ok';
    }
}

export type LabelStoreSnapshot = {
    entries: { keyHash: string; labelType: number; value: string; counter: number }[];
    counter: number;
    mac: string;
    walletId: string;
};

/**
 * The device refuses a proof whose (root, counter) no longer matches its own
 * counter — e.g. after another client changed a label. The spec's remedy is to
 * re-run the sync; here that means re-reading the state (which also resets the
 * local trie, since the fresh MAC authenticates the empty root).
 */
export const isStaleStateError = (e: unknown) =>
    e instanceof Error && /Invalid label MAC/.test(e.message);

export { fromHex, toHex };
