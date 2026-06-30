import { BLOCKCHAIN, BLOCKCHAIN_EVENT } from './events/blockchain';
import type { BlockchainEvent } from './events/blockchain';

/**
 * Arbitrary metadata stored per Bitcoin address.
 * Serialized as JSON in the database (future: protobuf BLOB).
 */
export type AddressMetadata = {
    label?: string;
    data?: unknown; // arbitrary JSON payload — extensible without schema changes
};

/**
 * Merkle proof path: ordered array of sibling hashes from the leaf to the Merkle root.
 * Stored in the database and reconstructed before sending to the device for verification.
 * Starts as an empty array for new entries; populated by the device on first dbchange.
 */
export type MerkleProof = string[];

/**
 * A full address entry as stored in the database.
 * counter tracks the version of this entry in the Merkle tree — incremented by the device
 * on each successful dbchange so stale updates can be rejected.
 * proof is reconstructed from the DB and sent to the device for verification on each dbchange.
 *
 * Device flow:
 *   dbchange (existing entry):
 *     1. Reconstruct proof from DB; send oldEntry.counter + oldEntry.proof + hash(oldMetadata) + hash(newMetadata) + treeState → device
 *     2. Device verifies proof against its stored root
 *     3. Device replaces the leaf, increments tree counter, recomputes root, returns new proof
 *     4. Store { metadata: newMetadata, counter: newEntryCounter, proof: newProof } + TreeState { root, counter } in DB
 *
 *   dbchange (new entry):
 *     1. Send hash(newMetadata) + treeState → device
 *     2. Device inserts new leaf, increments tree counter, recomputes root, returns proof
 *     3. Store { metadata: newMetadata, counter: 0, proof: newProof } + TreeState { root, counter } in DB
 *
 *   dblookup:
 *     1. Client retrieves { metadata, counter, proof } from DB
 *     2. proof is passed back to device on next dbchange for verification
 */
export type AddressEntry = {
    metadata: AddressMetadata;
    counter: number;
    proof: MerkleProof;
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

/**
 * Provider interface for Bitcoin address entry storage.
 * Implementations: BitcoinAddressDb/better-sqlite3 (connect-cli dev/testing),
 * Evolu (suite-desktop production).
 */
export type AddressLookupProvider = {
    lookup(address: string, networkSymbol: string): AddressEntry | null | Promise<AddressEntry | null>;
    lookupOrCreate(address: string, networkSymbol: string): AddressEntry | Promise<AddressEntry>;
    upsert(address: string, networkSymbol: string, entry: AddressEntry): void | Promise<void>;
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
 * then onAddressAnnotated is called with the full AddressEntry (metadata + counter + proof).
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
