import { DerivationPath } from '../../params';
import { Type, Static } from '@trezor/schema-utils';

export type TezosRevealOperation = Static<typeof TezosRevealOperation>;
export const TezosRevealOperation = Type.Object({
    source: Type.String(),
    fee: Type.Number(),
    counter: Type.Number(),
    gas_limit: Type.Number(),
    storage_limit: Type.Number(),
    public_key: Type.String(),
});

export type TezosManagerTransfer = Static<typeof TezosManagerTransfer>;
export const TezosManagerTransfer = Type.Object({
    destination: Type.String(),
    amount: Type.Number(),
});

export type TezosParametersManager = Static<typeof TezosParametersManager>;
export const TezosParametersManager = Type.Object({
    set_delegate: Type.Optional(Type.String()),
    cancel_delegate: Type.Optional(Type.Boolean()),
    transfer: Type.Optional(TezosManagerTransfer),
});

export type TezosTransactionOperation = Static<typeof TezosTransactionOperation>;
export const TezosTransactionOperation = Type.Object({
    source: Type.String(),
    destination: Type.String(),
    amount: Type.Number(),
    counter: Type.Number(),
    fee: Type.Number(),
    gas_limit: Type.Number(),
    storage_limit: Type.Number(),
    parameters: Type.Optional(Type.Array(Type.Number())),
    parameters_manager: Type.Optional(TezosParametersManager),
});

export type TezosOriginationOperation = Static<typeof TezosOriginationOperation>;
export const TezosOriginationOperation = Type.Object({
    source: Type.String(),
    balance: Type.Number(),
    delegate: Type.Optional(Type.String()),
    script: DerivationPath,
    fee: Type.Number(),
    counter: Type.Number(),
    gas_limit: Type.Number(),
    storage_limit: Type.Number(),
});

export type TezosDelegationOperation = Static<typeof TezosDelegationOperation>;
export const TezosDelegationOperation = Type.Object({
    source: Type.String(),
    delegate: Type.String(),
    fee: Type.Number(),
    counter: Type.Number(),
    gas_limit: Type.Number(),
    storage_limit: Type.Number(),
});

export type TezosOperation = Static<typeof TezosOperation>;
export const TezosOperation = Type.Object({
    reveal: Type.Optional(TezosRevealOperation),
    transaction: Type.Optional(TezosTransactionOperation),
    origination: Type.Optional(TezosOriginationOperation),
    delegation: Type.Optional(TezosDelegationOperation),
});

export type TezosSignTransaction = Static<typeof TezosSignTransaction>;
export const TezosSignTransaction = Type.Object({
    path: DerivationPath,
    branch: Type.String(),
    operation: TezosOperation,
    chunkify: Type.Optional(Type.Boolean()),
});
