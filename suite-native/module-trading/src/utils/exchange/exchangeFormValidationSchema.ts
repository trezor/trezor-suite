import { type NetworkConfigDeps } from '@suite-common/networks';
import { yup } from '@suite-common/validators';

import { sendCryptoAmountValidationSchema } from '../general/validationSchemes';

export const exchangeFormValidationSchema = (networkConfigDeps: NetworkConfigDeps) =>
    yup.object({
        sendCryptoAmount: sendCryptoAmountValidationSchema(networkConfigDeps),
    });
