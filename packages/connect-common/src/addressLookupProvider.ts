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
 * A full address entry as stored in the database.
 * counter tracks the version of this entry in the Merkle tree — incremented by the device
 * on each successful dbchange so stale updates can be rejected.
 * proof is NOT stored; it is ephemeral and produced/verified by the Trezor device on demand.
 *
 * Device flow:
 *   dbchange (existing entry):
 *     1. Client sends: address + entry.counter + hash(oldMetadata) + hash(newMetadata) → device
 *     2. Device verifies against its stored root using entry.counter as leaf version
 *     3. Device computes new leaf, updates root, increments tree counter
 *     4. Device returns: new root + new tree counter + new entry counter
 *     5. DB stores: { metadata: newMetadata, counter: newEntryCounter } + TreeState { root, counter }
 *
 *   dbchange (new entry):
 *     1. Client sends: address + hash(newMetadata) → device
 *     2. Device inserts new leaf, updates root, increments tree counter
 *     3. Device returns: new root + new tree counter; entry counter starts at 0
 *     4. DB stores: { metadata: newMetadata, counter: 0 } + TreeState { root, counter }
 *
 *   dblookup:
 *     1. Client retrieves { metadata, counter } from DB
 *     2. On next dbchange the counter is passed back for device-side verification
 */
export type AddressEntry = {
    metadata: AddressMetadata;
    counter: number;
};

/**
 * Global Merkle tree state stored in the database.
 * root   — current Merkle root hash as maintained by the Trezor device.
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
 * then onAddressAnnotated is called with the full AddressEntry (metadata + counter).
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
