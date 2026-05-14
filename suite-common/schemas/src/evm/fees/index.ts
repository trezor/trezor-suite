import z from 'zod';

import { evmHexString } from '../general';

const EvmFeeHexSchema = z.union([
    z.object({
        type: z.literal('eip1559'),
        maxFeePerGas: evmHexString,
        maxPriorityFeePerGas: evmHexString,
        gasLimit: evmHexString,
        baseFeePerGas: evmHexString,
    }),
    z.object({
        type: z.literal('legacy'),
        gasPrice: evmHexString,
        gasLimit: evmHexString,
    }),
]);

export type EvmFeeHex = z.infer<typeof EvmFeeHexSchema>;
type EvmFeeHexType<Type extends EvmFeeHex['type']> = Extract<EvmFeeHex, { type: Type }>;

/**
 * Sort out fee fields based on the tx type (legacy vs EIP1559)
 */
export function parseEvmFeeHex(raw: unknown) {
    const result = EvmFeeHexSchema.safeParse(raw);

    return result.success ? result.data : null;
}

/**
 * Remove tx type and put all fee fields on the same level for easier form handling
 */
export function flattenEvmFees(fee: EvmFeeHex) {
    const result: {
        gasLimit: EvmFeeHex['gasLimit'];
        gasPrice?: EvmFeeHexType<'legacy'>['gasPrice'];
        maxFeePerGas?: EvmFeeHexType<'eip1559'>['maxFeePerGas'];
        maxPriorityFeePerGas?: EvmFeeHexType<'eip1559'>['maxPriorityFeePerGas'];
        baseFeePerGas?: EvmFeeHexType<'eip1559'>['baseFeePerGas'];
    } = {
        gasLimit: fee.gasLimit,
    };

    switch (fee.type) {
        case 'eip1559':
            Object.assign(result, {
                maxFeePerGas: fee.maxFeePerGas,
                maxPriorityFeePerGas: fee.maxPriorityFeePerGas,
                baseFeePerGas: fee.baseFeePerGas,
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
