import { useEffect } from 'react';
import { useForm, useController } from 'react-hook-form';
import { useTranslation } from '@suite-hooks';
import { isHex } from '@wallet-utils/ethUtils';
import { isAddressValid } from '@wallet-utils/validation';
import type { Account } from '@wallet-types';

export const MAX_LENGTH_MESSAGE = 255;
export const MAX_LENGTH_SIGNATURE = 255;

export type SignVerifyFields = {
    message: string;
    address: string;
    path: string;
    signature: string;
    hex: boolean;
};

export const useSignVerifyForm = (page: 'sign' | 'verify', account?: Account) => {
    const { translationString } = useTranslation();

    const {
        register,
        handleSubmit,
        formState: { isDirty, errors },
        reset,
        setValue,
        clearErrors,
        control,
        trigger,
        watch,
    } = useForm<SignVerifyFields>({
        mode: 'onBlur',
        reValidateMode: 'onChange',
        defaultValues: {
            message: '',
            address: '',
            path: '',
            signature: '',
            hex: false,
        },
    });

    const { field: addressField } = useController({
        control,
        name: 'address',
        rules: {
            required: translationString('TR_SELL_VALIDATION_ERROR_EMPTY'),
            validate: (address: string) =>
                account?.symbol && !isAddressValid(address, account.symbol)
                    ? translationString('TR_ADD_TOKEN_ADDRESS_NOT_VALID')
                    : undefined,
        },
    });

    const { field: pathField } = useController({
        control,
        name: 'path',
        rules: {
            required: page === 'sign' && translationString('TR_SELL_VALIDATION_ERROR_EMPTY'),
        },
    });

    const { field: hexField } = useController({
        control,
        name: 'hex',
    });

    const messageRef = register({
        maxLength: MAX_LENGTH_MESSAGE,
        validate: (message: string) =>
            hexField.value && !isHex(message) ? translationString('DATA_NOT_VALID_HEX') : undefined,
    });

    const signatureRef = register({
        required: {
            value: page === 'verify',
            message: translationString('TR_SELL_VALIDATION_ERROR_EMPTY'),
        },
    });

    const formValues = watch();

    useEffect(() => {
        trigger('message');
    }, [trigger, formValues.hex]);

    useEffect(() => {
        if (page === 'sign') setValue('signature', '');
    }, [setValue, page, formValues.address, formValues.message]);

    return {
        formDirty: isDirty,
        formReset: () => reset(),
        formSubmit: handleSubmit,
        formValues,
        formErrors: {
            message: errors.message?.message,
            path: errors.path?.message,
            address: errors.address?.message,
            signature: errors.signature?.message,
        },
        formSetSignature: (value: string) => setValue('signature', value),
        messageRef,
        signatureRef,
        hexField: {
            checked: hexField.value,
            onChange: hexField.onChange,
        },
        addressField: {
            value: addressField.value,
            onChange: addressField.onChange,
            onBlur: addressField.onBlur,
        },
        pathField: {
            value: pathField.value,
            onBlur: pathField.onBlur,
            onChange: (addr: { path: string; address: string } | null) => {
                clearErrors(['path', 'address']);
                pathField.onChange(addr?.path || '');
                addressField.onChange(addr?.address || '');
            },
        },
    };
};
