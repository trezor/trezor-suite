import { yup } from '@suite-native/forms';

import {
    fiatAmountInputValidationSchema,
    sendCryptoAmountValidationSchema,
} from '../general/validationSchemes';

export const sellFormValidationSchema = yup.object({
    cryptoStringAmount: sendCryptoAmountValidationSchema,
    fiatStringAmount: fiatAmountInputValidationSchema,
});
