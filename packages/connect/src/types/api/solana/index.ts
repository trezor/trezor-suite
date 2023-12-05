import type { PublicKey } from '../../params';

// solanaGetPublicKey

export interface SolanaPublicKey extends PublicKey {
    publicKey: string;
}

// solanaSignTransaction

export interface SolanaTxTokenAccountInfo {
    baseAddress: string;
    tokenProgram: string;
    tokenMint: string;
    tokenAccount: string;
}

export interface SolanaTxAdditionalInfo {
    tokenAccountsInfos?: SolanaTxTokenAccountInfo[];
}

export interface SolanaSignTransaction {
    path: string | number[];
    serializedTx: string;
    additionalInfo?: SolanaTxAdditionalInfo;
}

export interface SolanaSignedTransaction {
    signature: string;
}
