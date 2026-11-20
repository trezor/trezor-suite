import type { tronComposeTransaction } from './tronComposeTransaction';
import type { tronGetAddress } from './tronGetAddress';
import type { tronSignTransaction } from './tronSignTransaction';

// Tron-specific operations
export type TrezorConnectTron = {
    tronGetAddress: typeof tronGetAddress;
    tronSignTransaction: typeof tronSignTransaction;
    tronComposeTransaction: typeof tronComposeTransaction;
};
