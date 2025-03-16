import { Static, Type } from '@trezor/schema-utils';

export type FeeInfo = Static<typeof FeeInfo>;
export const FeeInfo = Type.Object({
    blockTime: Type.Number(),
    minFee: Type.Number(),
    maxFee: Type.Number(),
    dustLimit: Type.Number(),
});

export type FeeLevel = Static<typeof FeeLevel>;
export const FeeLevel = Type.Object({
    label: Type.Union([
        Type.Literal('high'),
        Type.Literal('normal'),
        Type.Literal('economy'),
        Type.Literal('low'),
        Type.Literal('custom'),
    ]),
    blocks: Type.Number(),
    feePerUnit: Type.String(),
    feePerTx: Type.Optional(Type.String()), // fee for BlockchainEstimateFeeParams.request.specific
    // EVM + Solana
    feeLimit: Type.Optional(Type.String()),
    // EIP-1559
    baseFeePerGas: Type.Optional(Type.String()),
    maxFeePerGas: Type.Optional(Type.String()),
    maxPriorityFeePerGas: Type.Optional(Type.String()),
    maxWaitTimeEstimate: Type.Optional(Type.Number()),
});

export type SelectFeeLevel = Static<typeof SelectFeeLevel>;
export const SelectFeeLevel = Type.Union([
    Type.Object({
        name: Type.String(),
        fee: Type.Literal('0'),
        feePerByte: Type.Optional(Type.Undefined()),
        disabled: Type.Literal(true),
    }),
    Type.Object({
        name: Type.String(),
        fee: Type.String(),
        feePerByte: Type.String(),
        minutes: Type.Number(),
        total: Type.String(),
    }),
]);
