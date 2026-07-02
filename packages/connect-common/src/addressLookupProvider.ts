import { BLOCKCHAIN, BLOCKCHAIN_EVENT } from './events/blockchain';
import type { BlockchainEvent } from './events/blockchain';

/**
 * Arbitrary metadata stored per Bitcoin address.
 * Serialized as JSON in the database (future: protobuf BLOB).
 */
export type AddressMetadata = {
    label?: string;
    data?: unknown;    // arbitrary JSON payload — not stored in device offline cache
    data_mac?: string; // MAC authorizing the data field — stored in device offline cache
};

/**
 * Merkle proof path: ordered array of sibling hashes from the leaf to the Merkle root.
 * Computed on-the-fly from the MPT built over all stored entries — never stored in the DB.
 */
export type MerkleProof = string[];

/**
 * A full address entry as stored in the database.
 * counter tracks the version of this entry in the Merkle tree — incremented by the device
 * on each successful dbchange so stale updates can be rejected.
 * proof is NOT stored; it is generated from the MPT before each device interaction.
 */
export type AddressEntry = {
    metadata: AddressMetadata;
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

/** All entries returned for MPT construction. */
export type AllEntriesRow = {
    address: string;
    networkSymbol: string;
    entry: AddressEntry;
};

/**
 * Provider interface for Bitcoin address entry storage.
 * Implementations: BitcoinAddressDb/better-sqlite3 (connect-cli dev/testing),
 * Evolu (suite-desktop production).
 */
export type AddressLookupProvider = {
    lookup(address: string, networkSymbol: string): AddressEntry | null | Promise<AddressEntry | null>;
    lookupOrCreate(address: string, networkSymbol: string): AddressEntry | Promise<AddressEntry>;
    upsert(address: string, networkSymbol: string, entry: AddressEntry): void | Promise<void>;
    getAllEntries(): AllEntriesRow[] | Promise<AllEntriesRow[]>;
    getTreeState(): TreeState | null | Promise<TreeState | null>;
    setTreeState(state: TreeState): void | Promise<void>;
};

// Minimal interface for the TrezorConnect event emitter — avoids circular dep on @trezor/connect.
type BlockchainEventEmitter = {
    on(event: typeof BLOCKCHAIN_EVENT, listener: (event: BlockchainEvent) => void): void;
    off(event: typeof BLOCKCHAIN_EVENT, listener: (event: BlockchainEvent) => void): void;
};

type Deps = {
    trezorConnect: BlockchainEventEmitter;
    provider: AddressLookupProvider;
    onAddressAnnotated: (descriptor: string, entry: AddressEntry) => void;
};

/**
 * Subscribes to TrezorConnect BLOCKCHAIN_EVENT notifications for Bitcoin addresses.
 * On each notification the address entry is looked up (or auto-created) via the provider,
 * then onAddressAnnotated is called with the AddressEntry (metadata + counter).
 *
 * Returns a cleanup function that removes the listener.
 */
export const createBitcoinAddressNotificationHandler = ({
    trezorConnect,
    provider,
    onAddressAnnotated,
}: Deps): (() => void) => {
    const handler = async (event: BlockchainEvent) => {
        if (event.type !== BLOCKCHAIN.NOTIFICATION) return;
        if (event.payload.coin.type !== 'bitcoin') return;

        const descriptor = event.payload.notification.descriptor;
        const networkSymbol = event.payload.coin.shortcut.toLowerCase();

        const entry = await provider.lookupOrCreate(descriptor, networkSymbol);
        onAddressAnnotated(descriptor, entry);
    };

    trezorConnect.on(BLOCKCHAIN_EVENT, handler);

    return () => trezorConnect.off(BLOCKCHAIN_EVENT, handler);
};
