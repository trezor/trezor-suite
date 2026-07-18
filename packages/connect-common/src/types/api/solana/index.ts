import type { solanaComposeTransaction } from './solanaComposeTransaction';
import type { solanaGetAddress } from './solanaGetAddress';
import type { solanaGetPublicKey } from './solanaGetPublicKey';
import type { solanaSignTransaction } from './solanaSignTransaction';

// Solana-specific operations
export interface TrezorConnectSolana {
    solanaGetAddress: typeof solanaGetAddress;
    solanaGetPublicKey: typeof solanaGetPublicKey;
    solanaSignTransaction: typeof solanaSignTransaction;
    solanaComposeTransaction: typeof solanaComposeTransaction;
}
