import { getIsPassphraseTooLong } from '@suite-common/device';
import { yup } from '@suite-native/forms';

export type PassphraseFormContext = {
    passphraseMaxLength: number;
};

export const passphraseFormSchema = yup.object({
    passphrase: yup
        .string<string, PassphraseFormContext>()
        .required('Enter your passphrase to continue.')
        .test('is-too-long', 'Passphrase is too long.', (value, { options }) => {
            if (!options.context || value === undefined) return false;

            return !getIsPassphraseTooLong(value, options.context.passphraseMaxLength);
        }),
});

export type PassphraseFormValues = yup.InferType<typeof passphraseFormSchema>;
