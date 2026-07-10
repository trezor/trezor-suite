import { useCallback, useRef } from 'react';

import { yup } from '@suite-common/validators';
import { Button, type InputType, VStack } from '@suite-native/atoms';
import { Form, TextInputField, useForm } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';

import { useSyncLabelForm } from './useSyncLabelForm';

const labelValidationSchema = yup.object({
    label: yup.string().required(),
});

export type FormValues = yup.InferType<typeof labelValidationSchema>;

type LabelEditFormParam = {
    label: string | null;
    onSubmit: (label: string) => void;
};

export const LabelEditForm = ({ label, onSubmit }: LabelEditFormParam) => {
    const inputRef = useRef<InputType>(null);

    const form = useForm<FormValues>({
        validation: labelValidationSchema,
        defaultValues: { label: label ?? '' },
    });
    const {
        handleSubmit,
        formState: { isValid },
    } = form;

    const getResetValues = useCallback(
        (newLabel: string | null): FormValues => ({ label: newLabel ?? '' }),
        [],
    );

    useSyncLabelForm({ form, label, getResetValues });

    const onConfirm = handleSubmit((formValues: FormValues) => {
        onSubmit(formValues.label);
    });

    return (
        <VStack spacing="sp16">
            <Form form={form}>
                <VStack spacing="sp8">
                    <TextInputField
                        ref={inputRef}
                        name="label"
                        asBottomSheetInput
                        testID="@label-edit-form/input"
                    />
                    <Button
                        onPress={onConfirm}
                        isDisabled={!isValid}
                        testID="@label-edit-form/confirm-button"
                    >
                        <Translation id="generic.buttons.confirm" />
                    </Button>
                </VStack>
            </Form>
        </VStack>
    );
};
