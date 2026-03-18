import { z } from 'zod';

const evmHexString = z
    .string()
    .startsWith('0x')
    .transform(s => s as `0x${string}`);

export const UnsignedEvmTransactionSchema = z.object({
    from: evmHexString,
    to: evmHexString,
    data: evmHexString,
    chainId: z.number(),
});

export type UnsignedEvmTransaction = z.infer<typeof UnsignedEvmTransactionSchema>;

export const parseUnsignedEvmTransaction = (raw: unknown): UnsignedEvmTransaction | null => {
    if (typeof raw !== 'string') {
        return null;
    }

    try {
        const result = UnsignedEvmTransactionSchema.safeParse(JSON.parse(raw));

        return result.success ? result.data : null;
    } catch {
        return null;
    }
};
