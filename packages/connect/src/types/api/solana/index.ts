import type { Static } from '@trezor/schema-utils';
import { Type } from '@trezor/schema-utils';

import { PROTO } from '../../../constants';
import { PublicKey } from '../../params';

// solanaGetPublicKey

export type SolanaPublicKey = Static<typeof SolanaPublicKey>;
export const SolanaPublicKey = Type.Intersect([
    PublicKey,
    Type.Object({
        publicKey: Type.String(),
        publicKeyBase58: Type.String(),
    }),
]);

// solanaSignTransaction

export type SolanaTxTokenAccountInfo = Static<typeof SolanaTxTokenAccountInfo>;
export const SolanaTxTokenAccountInfo = Type.Object({
    baseAddress: Type.String(),
    tokenProgram: Type.String(),
    tokenMint: Type.String(),
    tokenAccount: Type.String(),
    symbol: Type.Optional(Type.String()),
});

export type SolanaTxAdditionalInfo = Static<typeof SolanaTxAdditionalInfo>;
export const SolanaTxAdditionalInfo = Type.Object({
    tokenAccountsInfos: Type.Optional(Type.Array(SolanaTxTokenAccountInfo, { minItems: 1 })),
    isDevnet: Type.Optional(Type.Boolean()),
});

export type SolanaSignTransaction = Static<typeof SolanaSignTransaction>;
export const SolanaSignTransaction = Type.Object({
    path: Type.Union([Type.String(), Type.Array(Type.Number())]),
    serializedTx: Type.String(),
    additionalInfo: Type.Optional(SolanaTxAdditionalInfo),
    payment_req: Type.Optional(PROTO.PaymentRequest),
    serialize: Type.Optional(Type.Boolean()),
    chunkify: Type.Optional(Type.Boolean()),
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

const SolanaComposeTransactionCommon = {
    fromAddress: Type.String(),
    amount: Type.String(),
    blockHash: Type.String(),
    lastValidBlockHeight: Type.Number(),
    priorityFees: Type.Optional(
        Type.Object({
            computeUnitPrice: Type.String(),
            computeUnitLimit: Type.String(),
        }),
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
};

const SolanaComposeSerializedTransaction = Type.Object({
    ...SolanaComposeTransactionCommon,
    toAddress: Type.Optional(Type.String()),
    serializedTx: Type.String(),
});

const SolanaComposeTransactionRaw = Type.Object({
    ...SolanaComposeTransactionCommon,
    toAddress: Type.String(), // required
    serializedTx: Type.Optional(Type.Undefined()), // forbidden
});

export const SolanaComposeTransaction = Type.Union([
    SolanaComposeSerializedTransaction,
    SolanaComposeTransactionRaw,
]);

export type SolanaComposeTransaction = Static<typeof SolanaComposeTransaction>;

export type SolanaComposedTransaction = Static<typeof SolanaComposedTransaction>;
export const SolanaComposedTransaction = Type.Object({
    serializedTx: Type.String(),
    additionalInfo: Type.Object({
        newAccountProgramName: Type.Optional(SolanaProgramName),
        tokenAccountInfo: Type.Optional(SolanaTxTokenAccountInfo),
    }),
});
