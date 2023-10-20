import type { PublicKey } from '../../params';

// solanaGetPublicKey

export interface SolanaPublicKey extends PublicKey {
    publicKey: string;
}

// solanaSignTransaction

export interface SolanaSignTransaction {
    path: string | number[];
    serializedTx: string;
}

export interface SolanaSignedTransaction {
    signature: string;
}
