import { formInputsMaxLength, yup } from '@suite-common/validators';

export const pinFormSchema = yup.object({
    pin: yup.string().required('Empty pin.').max(formInputsMaxLength.pin),
});

export type PinFormValues = yup.InferType<typeof pinFormSchema>;
