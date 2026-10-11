import type { BtcSwapComposeTemplate } from 'invity-api';
import { z } from 'zod';

const btcSwapComposeAmountSchema = z.discriminatedUnion('kind', [
    z.object({
        kind: z.literal('percent'),
        value: z.number().positive().max(100),
    }),
    z.object({
        kind: z.literal('sats'),
        value: z.string().regex(/^[1-9]\d*$/),
    }),
]);

const btcSwapComposeOutputSchema = z.discriminatedUnion('type', [
    z.object({
        type: z.literal('opreturn'),
        dataHex: z.string().regex(/^(?:[0-9a-fA-F]{2})+$/),
    }),
    z.object({
        type: z.literal('payment'),
        amount: btcSwapComposeAmountSchema,
    }),
]);

export const btcSwapComposeTemplateSchema: z.ZodType<BtcSwapComposeTemplate> = z.object({
    extraOutputs: z.array(btcSwapComposeOutputSchema),
});

export const parseBtcSwapComposeTemplate = (
    rawTemplate: unknown,
): BtcSwapComposeTemplate | undefined => {
    const result = btcSwapComposeTemplateSchema.safeParse(rawTemplate);

    if (!result.success) {
        console.error('[parseBtcSwapComposeTemplate]', result.error.message);

        return undefined;
    }

    return result.data;
};
