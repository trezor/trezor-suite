import { yup } from '@suite-native/forms';

import { sendCryptoAmountValidationSchema } from '../general/validationSchemes';

export const exchangeFormValidationSchema = yup.object({
    sendCryptoAmount: sendCryptoAmountValidationSchema,
});
