import { BLOCKCHAIN, BLOCKCHAIN_EVENT } from './events/blockchain';
import type { BlockchainEvent } from './events/blockchain';

/**
 * Arbitrary metadata stored per Bitcoin address (an "auth label").
 * Serialized as JSON in the database (future: protobuf BLOB).
 */
export type AuthLabelMetadata = {
    label?: string;
    data?: unknown; // arbitrary JSON payload — not stored in device offline cache
    data_mac?: string; // MAC authorizing the data field — stored in device offline cache
};

/**
 * Merkle proof path: ordered array of sibling hashes from the leaf to the Merkle root.
 * Computed on-the-fly from the MPT built over all stored entries — never stored in the DB.
 */
export type MerkleProof = string[];

/**
 * A full auth-label entry as stored in the database.
 * counter tracks the version of this entry in the Merkle tree — incremented by the device
 * on each successful dbchange so stale updates can be rejected.
 * proof is NOT stored; it is generated from the MPT before each device interaction.
 */
export type AuthLabelEntry = {
    metadata: AuthLabelMetadata;
    counter: number;
};

/**
 * Global Merkle tree state stored in the database.
 * root    — current Merkle root hash as maintained by the Trezor device.
 * counter — monotonically increasing version; incremented by the device on every tree mutation.
 */
export type TreeState = {
    root: string;
    counter: number;
};

/** A single row returned for MPT construction. */
export type AuthLabelRow = {
    address: string;
    networkSymbol: string;
    entry: AuthLabelEntry;
};

/**
 * Required storage contract for auth-label entries.
 * The only implementation today is AuthLabelDb (better-sqlite3, connect-cli dev/testing).
 * An Evolu-backed implementation for suite-desktop production is planned but not yet built.
 */
export type AuthLabelLookupProvider = {
    lookup(
        address: string,
        networkSymbol: string,
    ): AuthLabelEntry | null | Promise<AuthLabelEntry | null>;
    lookupOrCreate(
        address: string,
        networkSymbol: string,
    ): AuthLabelEntry | Promise<AuthLabelEntry>;
    upsert(address: string, networkSymbol: string, entry: AuthLabelEntry): void | Promise<void>;
    getAllEntries(): AuthLabelRow[] | Promise<AuthLabelRow[]>;
    getTreeState(): TreeState | null | Promise<TreeState | null>;
    setTreeState(state: TreeState): void | Promise<void>;
    /** Releases any held resources (e.g. an open database handle). */
    dispose?(): void | Promise<void>;
};

/**
 * Optional MAC pre-approval extension. A provider implementing this alongside
 * AuthLabelLookupProvider lets high-level AuthDB methods skip a redundant device
 * confirmation when a valid prior approval already exists for an entry.
 */
export type AuthLabelApprovalProvider = {
    lookupApproval(
        address: string,
        networkSymbol: string,
    ): { mac: string; deviceId: string } | null | Promise<{ mac: string; deviceId: string } | null>;
    setApproval(
        address: string,
        networkSymbol: string,
        mac: string,
        deviceId: string,
    ): void | Promise<void>;
};

/** Combined provider type accepted by ConnectSettings — approval support is optional. */
export type AuthLabelProvider = AuthLabelLookupProvider & Partial<AuthLabelApprovalProvider>;

// Minimal interface for the TrezorConnect event emitter — avoids circular dep on @trezor/connect.
type BlockchainEventEmitter = {
    on(event: typeof BLOCKCHAIN_EVENT, listener: (event: BlockchainEvent) => void): void;
    off(event: typeof BLOCKCHAIN_EVENT, listener: (event: BlockchainEvent) => void): void;
};

type Deps = {
    trezorConnect: BlockchainEventEmitter;
    provider: AuthLabelLookupProvider;
    onAddressAnnotated: (descriptor: string, entry: AuthLabelEntry) => void;
};

/**
 * Subscribes to TrezorConnect BLOCKCHAIN_EVENT notifications for Bitcoin addresses.
 * On each notification the auth-label entry is looked up (or auto-created) via the provider,
 * then onAddressAnnotated is called with the AuthLabelEntry (metadata + counter).
 *
 * Returns a cleanup function that removes the listener.
 */
export const createAuthLabelNotificationHandler = ({
    trezorConnect,
    provider,
    onAddressAnnotated,
}: Deps): (() => void) => {
    const handler = async (event: BlockchainEvent) => {
        if (event.type !== BLOCKCHAIN.NOTIFICATION) return;
        if (event.payload.coin.type !== 'bitcoin') return;

        const { descriptor } = event.payload.notification;
        const networkSymbol = event.payload.coin.shortcut.toLowerCase();

        const entry = await provider.lookupOrCreate(descriptor, networkSymbol);
        onAddressAnnotated(descriptor, entry);
    };

    trezorConnect.on(BLOCKCHAIN_EVENT, handler);

    return () => trezorConnect.off(BLOCKCHAIN_EVENT, handler);
};
