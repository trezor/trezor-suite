import { type FieldErrors, type FieldPath, useFormState } from 'react-hook-form';

import { type FormState } from '@suite-common/wallet-types';
import { Banner } from '@trezor/components';

export interface FieldErrorBannerProps {
    fieldName: FieldPath<FormState>;
}

export function FieldErrorBanner({ fieldName }: FieldErrorBannerProps) {
    const { errors } = useFormState<FormState>();
    const error = errors[fieldName as keyof FieldErrors<FormState>];

    if (!error) {
        return null;
    }

    return <Banner icon intent="critical" description={error.message} />;
}
