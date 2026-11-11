import { useEffect } from 'react';
import { useController, useForm, useWatch } from 'react-hook-form';

import { yupResolver } from '@hookform/resolvers/yup';

import { yup } from '@suite/forms';
import { type AddressValidator, injectAddressValidator } from '@suite-common/networks';
import { MAX_LENGTH_MESSAGE, type MessageSigningController } from '@suite-common/sign-verify';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { useServices } from '@trezor/dependency-injection';
import type { SignFormat } from '@trezor/network-module-suite-common-types';

export type SignVerifyFormFields = ReturnType<typeof useSignVerifyForm>;

type SignVerifyContext = {
    addressValidator: AddressValidator;
    isSignPage: boolean;
    symbol: NetworkSymbol;
};

// yup doesn't type properly conditionally required fields → need to declare type rather than infer it
export type SignVerifyFields = {
    message: string;
    address: string;
    hex: boolean;
    path?: string;
    signature?: string;
    /** One of the formats the network offered; absent when it offered no choice. */
    format?: SignFormat;
    pubKey?: string;
};

const signVerifySchema: yup.ObjectSchema<SignVerifyFields> = yup.object({
    message: yup
        .string()
        .max(MAX_LENGTH_MESSAGE, 'TR_TOO_LONG')
        .required()
        .when('hex', {
            is: true,
            then: schema => schema.isHex(),
        }),
    address: yup
        .string()
        .test(
            'isAddressValid',
            'TR_ADD_TOKEN_ADDRESS_NOT_VALID',
            (value, { options }) =>
                value &&
                options.context?.symbol &&
                options.context.addressValidator.isAddressValid(value, options.context.symbol),
        )
        .required(),
    path: yup.string().when('$isSignPage', {
        is: true,
        then: schema => schema.required(),
    }),
    signature: yup.string().when('$isSignPage', {
        is: false,
        then: schema => schema.required(),
    }),
    hex: yup.boolean().required(),
    format: yup.mixed<SignFormat>(),
    pubKey: yup.string(),
});

const DEFAULT_VALUES: SignVerifyFields = {
    message: '',
    address: '',
    format: undefined,
    path: '',
    signature: '',
    hex: false,
    pubKey: '',
};

export const useSignVerifyForm = (
    isSignPage: boolean,
    account: Account,
    signing: MessageSigningController,
) => {
    const { addressValidator } = useServices(injectAddressValidator);
    const { register, handleSubmit, formState, reset, setValue, clearErrors, control, trigger } =
        useForm<SignVerifyFields, SignVerifyContext>({
            mode: 'onBlur',
            reValidateMode: 'onChange',
            resolver: yupResolver(signVerifySchema),
            context: {
                addressValidator,
                isSignPage,
                symbol: account?.symbol,
            },
            defaultValues: DEFAULT_VALUES,
        });

    const { isDirty, errors, isSubmitting } = formState;

    const formValues = useWatch({ control });

    const { field: addressField } = useController({
        control,
        name: 'address',
    });
    const { field: pathField } = useController({
        control,
        name: 'path',
    });
    const { field: hexField } = useController({
        control,
        name: 'hex',
    });
    const { field: formatField } = useController({
        control,
        name: 'format',
    });

    useEffect(() => {
        if (formValues.message) {
            trigger('message');
        }
    }, [trigger, formValues.message, formValues.hex]);

    useEffect(() => {
        if (isSignPage) {
            setValue('signature', '');
            setValue('pubKey', '');
        }
    }, [setValue, isSignPage, formValues.address, formValues.message, formValues.format]);

    // The network decides the starting format and, for a fixed-address network, the address
    // itself; the form only keeps what the user changes from there.
    const { fixedAddress, formatChoice } = signing;
    const defaultFormat = formatChoice?.options[0]?.format;

    useEffect(() => {
        reset({
            ...DEFAULT_VALUES,
            format: defaultFormat,
            ...(isSignPage && fixedAddress !== undefined
                ? { path: fixedAddress.path, address: fixedAddress.address }
                : {}),
        });
    }, [reset, isSignPage, account.key, defaultFormat, fixedAddress]);
    type FormSetSignatureParams = { signature: string; pubKey?: string };

    return {
        isFormDirty: isDirty,
        isSubmitting,
        resetForm: () => reset(),
        formSubmit: handleSubmit,
        formValues,
        formErrors: errors,
        formSetSignature: ({ signature, pubKey }: FormSetSignatureParams) => {
            setValue('signature', signature);
            setValue('pubKey', pubKey || '');
        },
        register,
        hexField: {
            isChecked: hexField.value,
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
            isDisabled: signing.isAddressFixed,
        },
        formatField: {
            selectedOption: formatField.value,
            onChange: formatField.onChange,
        },
    };
};
