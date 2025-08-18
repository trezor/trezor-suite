import { Ref, useRef } from 'react';
import { useDispatch } from 'react-redux';

import { BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';

import { updateAddressLabelThunk } from '@suite-common/local-first-storage';
import { yup } from '@suite-common/validators';
import { BottomSheetModal, Button, InputType, VStack } from '@suite-native/atoms';
import { Form, TextInputField, useForm } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';
import type { StaticSessionId } from '@trezor/connect';

const labelValidationSchema = yup.object({
    label: yup.string().required(),
});

export type FormValues = yup.InferType<typeof labelValidationSchema>;

type AddressLabelBottomSheetProps = {
    onClose: () => void;
    ref: Ref<BottomSheetModalMethods>;
    address: string;
    deviceStaticSessionId: StaticSessionId;
    label: string | null;
};

export const AddressLabelBottomSheet = ({
    onClose,
    ref,
    address,
    deviceStaticSessionId,
    label,
}: AddressLabelBottomSheetProps) => {
    const dispatch = useDispatch();

    const inputRef = useRef<InputType>(null);

    const form = useForm<FormValues>({
        validation: labelValidationSchema,
        defaultValues: { label: label ?? '' },
    });

    const {
        handleSubmit,
        formState: { isValid },
    } = form;

    const onConfirm = handleSubmit((formValues: FormValues) => {
        dispatch(
            updateAddressLabelThunk({ deviceStaticSessionId, address, label: formValues.label }),
        );
        onClose();
    });

    return (
        <BottomSheetModal
            ref={ref}
            title={<Translation id="labeling.label" />}
            onDismiss={onClose}
            isCloseDisplayed={false}
        >
            <VStack spacing="sp16">
                <Form form={form}>
                    <VStack spacing="sp8">
                        <TextInputField ref={inputRef} name="label" />
                        <Button onPress={onConfirm} size="large" isDisabled={!isValid}>
                            Confirm
                        </Button>
                    </VStack>
                </Form>
            </VStack>
        </BottomSheetModal>
    );
};
