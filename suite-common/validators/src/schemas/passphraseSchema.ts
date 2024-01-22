import { yup } from '../config';
import { formInputsMaxLength } from '../inputsLengthConfig';

export const passphraseFormSchema = yup.object({
    passphrase: yup
        .string()
        .required('Empty passphrase.')
        .max(formInputsMaxLength.passphrase)
        .min(1),
});

export type PassphraseFormValues = yup.InferType<typeof passphraseFormSchema>;
