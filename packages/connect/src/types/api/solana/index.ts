import { Type, Static } from '@trezor/schema-utils';

import { PublicKey } from '../../params';

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
    tokenAccountsInfos: Type.Optional(Type.Array(SolanaTxTokenAccountInfo, { minItems: 1 })),
});

export type SolanaSignTransaction = Static<typeof SolanaSignTransaction>;
export const SolanaSignTransaction = Type.Object({
    path: Type.Union([Type.String(), Type.Array(Type.Number())]),
    serializedTx: Type.String(),
    additionalInfo: Type.Optional(SolanaTxAdditionalInfo),
    serialize: Type.Optional(Type.Boolean()),
});

export type SolanaSignedTransaction = Static<typeof SolanaSignedTransaction>;
export const SolanaSignedTransaction = Type.Object({
    signature: Type.String(),
    serializedTx: Type.Optional(Type.String()),
});

export type SolanaProgramName = Static<typeof SolanaProgramName>;
export const SolanaProgramName = Type.Union([
    Type.Literal('spl-token'),
    Type.Literal('spl-token-2022'),
]);

export type SolanaComposeTransaction = Static<typeof SolanaComposeTransaction>;
export const SolanaComposeTransaction = Type.Object({
    fromAddress: Type.String(),
    toAddress: Type.String(),
    amount: Type.String(),
    blockHash: Type.String(),
    lastValidBlockHeight: Type.Number(),
    priorityFees: Type.Optional(
        Type.Object({ computeUnitPrice: Type.String(), computeUnitLimit: Type.String() }),
    ),
    token: Type.Optional(
        Type.Object({
            mint: Type.String(),
            program: SolanaProgramName,
            decimals: Type.Number(),
            accounts: Type.Array(Type.Object({ publicKey: Type.String(), balance: Type.String() })),
        }),
    ),
    coin: Type.Optional(Type.String()),
    identity: Type.Optional(Type.String()),
});

export type SolanaComposedTransaction = Static<typeof SolanaComposedTransaction>;
export const SolanaComposedTransaction = Type.Object({
    serializedTx: Type.String(),
    additionalInfo: Type.Object({
        isCreatingAccount: Type.Boolean(),
        newTokenAccountProgramName: Type.Optional(SolanaProgramName),
        tokenAccountInfo: Type.Optional(SolanaTxTokenAccountInfo),
    }),
});
