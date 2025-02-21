import { Static, Type } from '@trezor/schema-utils';

export type FeeInfo = Static<typeof FeeInfo>;
export const FeeInfo = Type.Object({
    blockTime: Type.Number(),
    minFee: Type.Number(),
    maxFee: Type.Number(),
    dustLimit: Type.Number(),
});

export type PriorityFeeEstimationDetails = Static<typeof PriorityFeeEstimationDetails>;
export const PriorityFeeEstimationDetails = Type.Object({
    maxFeePerGas: Type.String(),
    maxPriorityFeePerGas: Type.String(),
    maxWaitTimeEstimate: Type.Optional(Type.Number()),
    minWaitTimeEstimate: Type.Optional(Type.Number()),
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
    feePerUnit: Type.String(),
    blocks: Type.Number(),
    feeLimit: Type.Optional(Type.String()), // eth gas limit
    feePerTx: Type.Optional(Type.String()), // fee for BlockchainEstimateFeeParams.request.specific
    baseFeePerGas: Type.Optional(Type.String()),
    maxFeePerGas: Type.Optional(Type.String()),
    effectiveGasPrice: Type.Optional(Type.String()),
    maxPriorityFeePerGas: Type.Optional(Type.String()),
    maxWaitTimeEstimate: Type.Optional(Type.Number()),
    minWaitTimeEstimate: Type.Optional(Type.Number()),
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
