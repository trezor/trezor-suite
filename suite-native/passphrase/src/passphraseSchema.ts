import { PASSPHRASE_MAX_LENGTH } from '@suite-common/device';
import { yup } from '@suite-common/validators';

export const passphraseFormSchema = yup.object({
    passphrase: yup
        .string()
        .required('Enter your passphrase to continue.')
        .max(PASSPHRASE_MAX_LENGTH),
});

export type PassphraseFormValues = yup.InferType<typeof passphraseFormSchema>;
