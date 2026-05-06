import z from 'zod';

export const evmHexString = z
    .string()
    .startsWith('0x')
    .transform(s => s as `0x${string}`);

export type EvmHexString = z.infer<typeof evmHexString>;

export const evmNumberLike = z.union([z.number(), evmHexString]);
