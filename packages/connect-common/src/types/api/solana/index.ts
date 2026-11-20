import type { solanaComposeTransaction } from './solanaComposeTransaction';
import type { solanaGetAddress } from './solanaGetAddress';
import type { solanaGetPublicKey } from './solanaGetPublicKey';
import type { solanaSignMessage } from './solanaSignMessage';
import type { solanaSignTransaction } from './solanaSignTransaction';

// Solana-specific operations
export type TrezorConnectSolana = {
    solanaGetAddress: typeof solanaGetAddress;
    solanaGetPublicKey: typeof solanaGetPublicKey;
    solanaSignTransaction: typeof solanaSignTransaction;
    solanaSignMessage: typeof solanaSignMessage;
    solanaComposeTransaction: typeof solanaComposeTransaction;
};
