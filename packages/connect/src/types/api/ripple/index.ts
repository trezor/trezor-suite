import { DerivationPath } from '../../params';
import { Type, Static } from '@trezor/schema-utils';

export type RipplePayment = Static<typeof RipplePayment>;
export const RipplePayment = Type.Object({
    amount: Type.String(),
    destination: Type.String(),
    destinationTag: Type.Optional(Type.Number()),
});

export type RippleTransaction = Static<typeof RippleTransaction>;
export const RippleTransaction = Type.Object({
    fee: Type.String(),
    flags: Type.Optional(Type.Number()),
    sequence: Type.Number(),
    maxLedgerVersion: Type.Optional(Type.Number()), // Proto: "last_ledger_sequence"
    payment: RipplePayment,
});

export type RippleSignTransaction = Static<typeof RippleSignTransaction>;
export const RippleSignTransaction = Type.Object({
    path: DerivationPath,
    transaction: RippleTransaction,
    chunkify: Type.Optional(Type.Boolean()),
});

export type RippleSignedTx = Static<typeof RippleSignedTx>;
export const RippleSignedTx = Type.Object({
    serializedTx: Type.String(),
    signature: Type.String(),
});
