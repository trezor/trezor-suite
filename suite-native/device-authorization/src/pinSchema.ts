import { PIN_MAX_LENGTH } from '@suite-common/device';
import { yup } from '@suite-common/validators';

export const pinFormSchema = yup.object({
    pin: yup.string().required('Empty pin.').max(PIN_MAX_LENGTH),
});

export type PinFormValues = yup.InferType<typeof pinFormSchema>;
