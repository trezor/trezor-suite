import { BLOCKCHAIN, BLOCKCHAIN_EVENT } from './events/blockchain';
import type { BlockchainEvent } from './events/blockchain';

// Extensible metadata stored per Bitcoin address.
// Future: encode as protobuf (change column to BLOB) without altering this interface.
export type AddressMetadata = {
    label?: string;
};

/**
 * Provider interface for Bitcoin address metadata storage.
 * Implementations: better-sqlite3 (connect-cli dev/testing), Evolu (suite production).
 */
export type AddressLookupProvider = {
    lookupOrCreate(address: string, networkSymbol: string): AddressMetadata | Promise<AddressMetadata>;
    upsert(address: string, networkSymbol: string, metadata: AddressMetadata): void | Promise<void>;
};

// Minimal interface for the TrezorConnect event emitter, avoiding a circular dep on @trezor/connect.
type BlockchainEventEmitter = {
    on(event: typeof BLOCKCHAIN_EVENT, listener: (event: BlockchainEvent) => void): void;
    off(event: typeof BLOCKCHAIN_EVENT, listener: (event: BlockchainEvent) => void): void;
};

type Deps = {
    trezorConnect: BlockchainEventEmitter;
    provider: AddressLookupProvider;
    onAddressAnnotated: (descriptor: string, metadata: AddressMetadata) => void;
};

/**
 * Subscribes to TrezorConnect BLOCKCHAIN_EVENT notifications for Bitcoin addresses.
 * On each notification the address is looked up (or auto-created) via the provider,
 * then onAddressAnnotated is called with the result.
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

        const metadata = await provider.lookupOrCreate(descriptor, networkSymbol);
        onAddressAnnotated(descriptor, metadata);
    };

    trezorConnect.on(BLOCKCHAIN_EVENT, handler);

    return () => trezorConnect.off(BLOCKCHAIN_EVENT, handler);
};
