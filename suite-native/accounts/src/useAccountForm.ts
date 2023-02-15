import { yup } from '@trezor/validation';
import { useForm } from '@suite-native/forms';

export const MAX_ACCOUNT_LABEL_LENGTH = 30;

export type AccountFormValues = yup.InferType<typeof accountFormValidationSchema>;

const accountFormValidationSchema = yup.object({
    accountLabel: yup.string().required().max(MAX_ACCOUNT_LABEL_LENGTH),
});

export const useAccountForm = (accountName?: string) =>
    useForm<AccountFormValues>({
        validation: accountFormValidationSchema,
        defaultValues: {
            accountLabel: accountName,
        },
    });
