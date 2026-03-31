import { z } from 'zod';

const evmHexString = z
    .string()
    .startsWith('0x')
    .transform(s => s as `0x${string}`);

const evmNumberLike = z.union([z.number(), evmHexString]);

export const UnsignedEvmTransactionSchema = z.object({
    from: evmHexString,
    to: evmHexString,
    data: evmHexString,
    chainId: z.number(),
});

export type UnsignedEvmTransaction = z.infer<typeof UnsignedEvmTransactionSchema>;

export const UnsignedEvmTransactionForSigningSchema = UnsignedEvmTransactionSchema.extend({
    gasLimit: evmHexString,
    nonce: evmNumberLike,
    type: z.number().optional(),
    value: evmHexString.optional(),
    gasPrice: evmHexString.optional(),
    maxFeePerGas: evmHexString.optional(),
    maxPriorityFeePerGas: evmHexString.optional(),
});

export type UnsignedEvmTransactionForSigning = z.infer<
    typeof UnsignedEvmTransactionForSigningSchema
>;

export const parseUnsignedEvmTransaction = (raw: unknown): UnsignedEvmTransaction | null => {
    if (typeof raw !== 'string') {
        return null;
    }

    try {
        return UnsignedEvmTransactionSchema.parse(JSON.parse(raw));
    } catch {
        return null;
    }
};

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
