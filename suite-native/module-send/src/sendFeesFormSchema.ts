import { yup } from '@suite-common/validators';

import { NativeSupportedFeeLevel } from './types';

const nativeSupportedFeeLevels: Array<NativeSupportedFeeLevel> = ['economy', 'normal', 'high'];

export const sendFeesFormValidationSchema = yup.object({
    feeLevel: yup.string().oneOf(nativeSupportedFeeLevels).required('Fee level is required'),
});

export type SendFeesFormValues = yup.InferType<typeof sendFeesFormValidationSchema>;
