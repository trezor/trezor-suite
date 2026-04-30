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

export const EvmFeeSchema = z.union([
    z.object({
        type: z.literal('eip1559'),
        maxFeePerGas: evmHexString,
        maxPriorityFeePerGas: evmHexString,
        gasLimit: evmHexString,
    }),
    z.object({
        type: z.literal('legacy'),
        gasPrice: evmHexString,
        gasLimit: evmHexString,
    }),
]);

type EvmFee = z.infer<typeof EvmFeeSchema>;
type EvmFeeType<Type extends EvmFee['type']> = Extract<EvmFee, { type: Type }>;

export function parseEvmFee(raw: unknown) {
    const result = EvmFeeSchema.safeParse(raw);

    return result.success ? result.data : null;
}

export function flattenEvmFees(fee: EvmFee) {
    const result: Pick<EvmFee, 'gasLimit'> & {
        gasPrice?: EvmFeeType<'legacy'>['gasPrice'];
        maxFeePerGas?: EvmFeeType<'eip1559'>['maxFeePerGas'];
        maxPriorityFeePerGas?: EvmFeeType<'eip1559'>['maxPriorityFeePerGas'];
    } = {
        gasLimit: fee.gasLimit,
    };

    switch (fee.type) {
        case 'eip1559':
            Object.assign(result, {
                maxFeePerGas: fee.maxFeePerGas,
                maxPriorityFeePerGas: fee.maxPriorityFeePerGas,
            });
            break;
        case 'legacy':
            Object.assign(result, {
                gasPrice: fee.gasPrice,
            });
            break;
    }

    return result;
}
