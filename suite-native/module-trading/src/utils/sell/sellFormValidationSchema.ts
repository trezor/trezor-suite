import { type NetworkConfigDeps } from '@suite-common/networks';
import { yup } from '@suite-common/validators';

import {
    fiatAmountInputValidationSchema,
    sendCryptoAmountValidationSchema,
} from '../general/validationSchemes';

export const sellFormValidationSchema = (networkConfigDeps: NetworkConfigDeps) =>
    yup.object({
        cryptoStringAmount: sendCryptoAmountValidationSchema(networkConfigDeps),
        fiatStringAmount: fiatAmountInputValidationSchema,
    });
