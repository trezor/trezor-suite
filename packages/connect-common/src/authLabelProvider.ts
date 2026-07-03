import type { AuthLabelEntry, AuthLabelLookupProvider } from '@trezor/authdb';

import { BLOCKCHAIN, BLOCKCHAIN_EVENT } from './events/blockchain';
import type { BlockchainEvent } from './events/blockchain';

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
