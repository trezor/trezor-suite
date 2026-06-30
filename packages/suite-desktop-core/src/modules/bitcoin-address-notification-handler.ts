import { BLOCKCHAIN, BLOCKCHAIN_EVENT } from '@trezor/connect-common';
import type { BlockchainEvent } from '@trezor/connect-common';
import type TrezorConnect from '@trezor/connect';

import type { AddressMetadata, BitcoinAddressDb } from './bitcoin-address-db';

type Deps = {
    trezorConnect: typeof TrezorConnect;
    db: BitcoinAddressDb;
    onAddressAnnotated: (descriptor: string, metadata: AddressMetadata | null) => void;
};

export const createBitcoinAddressNotificationHandler = ({
    trezorConnect,
    db,
    onAddressAnnotated,
}: Deps): (() => void) => {
    const handler = (event: BlockchainEvent) => {
        if (event.type !== BLOCKCHAIN.NOTIFICATION) return;
        if (event.payload.coin.type !== 'bitcoin') return;

        const descriptor = event.payload.notification.descriptor;
        const networkSymbol = event.payload.coin.shortcut.toLowerCase();

        const metadata = db.lookup(descriptor, networkSymbol);
        onAddressAnnotated(descriptor, metadata);
    };

    trezorConnect.on(BLOCKCHAIN_EVENT, handler);

    return () => trezorConnect.off(BLOCKCHAIN_EVENT, handler);
};
