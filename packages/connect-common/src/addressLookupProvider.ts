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
 * Produced and verified by the Trezor device. Empty array = unverified (new entry).
 *
 * Device flow:
 *   dbchange (existing entry):
 *     1. Client sends: oldEntry.proof + oldEntry.metadata + newMetadata → device
 *     2. Device verifies oldEntry.proof against its stored root
 *     3. Device computes new leaf hash(newMetadata), updates root
 *     4. Device returns: newProof for the updated entry
 *
 *   dbchange (new entry):
 *     1. Client sends: newMetadata (no prior proof) → device
 *     2. Device computes new leaf, inserts into tree, updates root
 *     3. Device returns: newProof for the new entry
 *
 *   dblookup:
 *     1. Client retrieves { metadata, proof } from DB
 *     2. Proof can be passed back on the next dbchange for verification
 */
export type MerkleProof = string[];

/**
 * A full address entry as stored in the database.
 * proof is kept separate from metadata so the device layer can handle it
 * independently of the user-visible data fields.
 */
export type AddressEntry = {
    metadata: AddressMetadata;
    proof: MerkleProof;
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
 * then onAddressAnnotated is called with the full AddressEntry (metadata + proof).
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
