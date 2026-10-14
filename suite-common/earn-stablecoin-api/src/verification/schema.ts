import { z } from 'zod';

import { evmHexString } from '@suite-common/schemas/src/evm';

export const UnsignedEvmTransactionSchema = z.object({
    from: evmHexString,
    to: evmHexString,
    data: evmHexString,
    chainId: z.number(),
});

export const UnsignedEvmTransactionForSigningSchema = UnsignedEvmTransactionSchema.extend({
    gasLimit: evmHexString,
    nonce: z.union([
        z.number().transform((n): `0x${string}` => `0x${n.toString(16)}`),
        evmHexString,
    ]),
    type: z.number().optional(),
    value: evmHexString.optional(),
    gasPrice: evmHexString.optional(),
    maxFeePerGas: evmHexString.optional(),
    maxPriorityFeePerGas: evmHexString.optional(),
});

export type UnsignedEvmTransactionForSigning = z.infer<
    typeof UnsignedEvmTransactionForSigningSchema
>;

export const parseUnsignedEvmTransactionForSigning = (
    raw: unknown,
): UnsignedEvmTransactionForSigning | null => {
    if (typeof raw !== 'string') {
        return null;
    }

    try {
        return UnsignedEvmTransactionForSigningSchema.parse(JSON.parse(raw));
    } catch {
        return null;
    }
};
