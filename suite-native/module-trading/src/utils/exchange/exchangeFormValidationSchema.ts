import { yup } from '@suite-common/validators';

import { sendCryptoAmountValidationSchema } from '../general/validationSchemes';

export const exchangeFormValidationSchema = yup.object({
    sendCryptoAmount: sendCryptoAmountValidationSchema,
});
