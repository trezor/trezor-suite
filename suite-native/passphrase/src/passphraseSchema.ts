import { formInputsMaxLength, yup } from '@suite-common/validators';

export const passphraseFormSchema = yup.object({
    passphrase: yup
        .string()
        .required('Enter your passphrase to continue.')
        .max(formInputsMaxLength.passphrase),
});

export type PassphraseFormValues = yup.InferType<typeof passphraseFormSchema>;
