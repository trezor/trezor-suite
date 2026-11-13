import type { Static } from '@trezor/schema-utils';
import { Type } from '@trezor/schema-utils';

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
});
