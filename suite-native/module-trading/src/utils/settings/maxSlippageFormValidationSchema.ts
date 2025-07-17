import { yup } from '@suite-common/validators';

const SLIPPAGE_VALIDATION_ERROR = 'Slippage must be between 0.01 and 50';
const MIN_SLIPPAGE = 0.01;
const MAX_SLIPPAGE = 50;

export const maxSlippageFormValidationSchema = yup.object({
    maxSlippage: yup
        .number()
        .typeError(SLIPPAGE_VALIDATION_ERROR)
        .min(MIN_SLIPPAGE, SLIPPAGE_VALIDATION_ERROR)
        .max(MAX_SLIPPAGE, SLIPPAGE_VALIDATION_ERROR)
        .required(SLIPPAGE_VALIDATION_ERROR),
});
