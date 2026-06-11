import { yup } from '@suite-common/validators';

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
    yup
        .string()
        .required(messages.required)
        .test('is-number', messages.notNumber, value => !Number.isNaN(Number(value)))
        .test('in-range', messages.outOfRange, value => {
            const slippage = Number(value);

            return slippage >= Number(SLIPPAGE_MIN) && slippage <= Number(SLIPPAGE_MAX);
        });
