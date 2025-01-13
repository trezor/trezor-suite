import { yup } from '@suite-common/validators';
import { useForm } from '@suite-native/forms';

export const MAX_ACCOUNT_LABEL_LENGTH = 30;
export const ALMOST_MAX_ACCOUNT_LABEL_LENGTH = MAX_ACCOUNT_LABEL_LENGTH - 5;

export type AccountFormValues = yup.InferType<typeof accountFormValidationSchema>;

const accountFormValidationSchema = yup.object({
    accountLabel: yup.string().required().max(MAX_ACCOUNT_LABEL_LENGTH),
});

export const useAccountLabelForm = (accountName?: string) =>
    useForm<AccountFormValues>({
        validation: accountFormValidationSchema,
        defaultValues: {
            accountLabel: accountName,
        },
    });
