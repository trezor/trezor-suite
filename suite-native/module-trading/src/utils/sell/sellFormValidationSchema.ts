import { yup } from '@suite-common/validators';

import {
    fiatAmountInputValidationSchema,
    sendCryptoAmountValidationSchema,
} from '../general/validationSchemes';

export const sellFormValidationSchema = yup.object({
    cryptoStringAmount: sendCryptoAmountValidationSchema,
    fiatStringAmount: fiatAmountInputValidationSchema,
});
