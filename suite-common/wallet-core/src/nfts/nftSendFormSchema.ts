import z from 'zod';

import { isAddress } from 'viem';

export const createNftSendFormSchema = (maxAmount?: number) =>
    z.object({
        recipient: z
            .string()
            .min(1, 'Recipient is required')
            .refine(val => isAddress(val, { strict: false }), { message: 'Invalid EVM address' }),
        amount: (() => {
            if (maxAmount !== undefined) {
                // ERC1155: positive integer, capped at per-id balance
                return z.coerce
                    .number({ message: 'Amount must be a number' })
                    .int('Amount must be a whole number')
                    .min(1, 'Amount must be at least 1')
                    .max(maxAmount, `Amount cannot exceed ${maxAmount}`);
            }

            // ERC721: always exactly 1
            return z.literal(1);
        })(),
    });

export type NftSendFormValues = z.infer<ReturnType<typeof createNftSendFormSchema>>;
