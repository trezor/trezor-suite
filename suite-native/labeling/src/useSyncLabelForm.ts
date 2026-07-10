import { useEffect } from 'react';

import { type FieldValues, type UseFormReturn } from '@suite-native/forms';

type UseSyncLabelFormParams<TFormValues extends FieldValues> = {
    form: Pick<UseFormReturn<TFormValues>, 'formState' | 'reset'>;
    label: string | null;
    getResetValues: (label: string | null) => TFormValues;
};

export const useSyncLabelForm = <TFormValues extends FieldValues>({
    form,
    label,
    getResetValues,
}: UseSyncLabelFormParams<TFormValues>) => {
    const {
        reset,
        formState: { isDirty },
    } = form;

    useEffect(() => {
        if (!isDirty) {
            reset(getResetValues(label));
        }
    }, [getResetValues, isDirty, label, reset]);
};
