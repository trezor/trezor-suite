import { PublicKey } from '../../params';
import { Type, Static } from '@trezor/schema-utils';

// solanaGetPublicKey

export type SolanaPublicKey = Static<typeof SolanaPublicKey>;
export const SolanaPublicKey = Type.Intersect([
    PublicKey,
    Type.Object({
        publicKey: Type.String(),
    }),
]);

// solanaSignTransaction

export type SolanaTxTokenAccountInfo = Static<typeof SolanaTxTokenAccountInfo>;
export const SolanaTxTokenAccountInfo = Type.Object({
    baseAddress: Type.String(),
    tokenProgram: Type.String(),
    tokenMint: Type.String(),
    tokenAccount: Type.String(),
});

export type SolanaTxAdditionalInfo = Static<typeof SolanaTxAdditionalInfo>;
export const SolanaTxAdditionalInfo = Type.Object({
    tokenAccountsInfos: Type.Optional(Type.Array(SolanaTxTokenAccountInfo)),
});

export type SolanaSignTransaction = Static<typeof SolanaSignTransaction>;
export const SolanaSignTransaction = Type.Object({
    path: Type.Union([Type.String(), Type.Array(Type.Number())]),
    serializedTx: Type.String(),
    additionalInfo: Type.Optional(SolanaTxAdditionalInfo),
});

export type SolanaSignedTransaction = Static<typeof SolanaSignedTransaction>;
export const SolanaSignedTransaction = Type.Object({
    signature: Type.String(),
});
