import { type Identity, Wallet } from '@arkade-os/sdk';

import { ARK_SIGNET_ESPLORA_URL, ARK_SIGNET_SERVER_URL } from './arkConstants';

type InitializeArkWalletParams = {
    identity: Identity;
    arkServerUrl?: string;
    esploraUrl?: string;
};

// This initializes an Ark wallet against the configured operator. Defaults
// target signet because the PoC stays on signet for now. The SDK wires up
// IndexedDB storage automatically when no storage config is passed.
export const initializeArkWallet = ({
    identity,
    arkServerUrl = ARK_SIGNET_SERVER_URL,
    esploraUrl = ARK_SIGNET_ESPLORA_URL,
}: InitializeArkWalletParams) =>
    Wallet.create({
        identity,
        arkServerUrl,
        esploraUrl,
    });
