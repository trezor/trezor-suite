import { z } from 'zod';

import { SLIPPAGE_MAX, SLIPPAGE_MIN } from '../constants';

export interface SlippageFormValues {
    slippage: string;
}

export interface SlippageFormValidationMessages {
    required: string;
    notNumber: string;
    outOfRange: string;
}

export const getSlippageFormValidationSchema = (messages: SlippageFormValidationMessages) =>
    z
        .string(messages.required)
        .min(1, messages.required)
        .refine(value => !Number.isNaN(Number(value)), messages.notNumber)
        .refine(value => {
            const slippage = Number(value);

            return slippage >= Number(SLIPPAGE_MIN) && slippage <= Number(SLIPPAGE_MAX);
        }, messages.outOfRange);
