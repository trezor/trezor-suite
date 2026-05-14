import { useEffect, useRef } from 'react';

import { yup } from '@suite-common/validators';
import { Button, type InputType, VStack } from '@suite-native/atoms';
import { Form, TextInputField, useForm } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';

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
        reset,
        formState: { isValid, isDirty },
    } = form;

    // Sync form when labels load asynchronously (e.g. after turning on Suite Sync).
    useEffect(() => {
        if (!isDirty) {
            reset({ label: label ?? '' });
        }
    }, [isDirty, label, reset]);

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
