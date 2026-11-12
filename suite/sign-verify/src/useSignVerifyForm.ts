import { useEffect } from 'react';
import { useController, useForm, useWatch } from 'react-hook-form';

import { yupResolver } from '@hookform/resolvers/yup';

import { yup } from '@suite/forms';
import { type AddressValidator, injectAddressValidator } from '@suite-common/networks';
import { MAX_LENGTH_MESSAGE } from '@suite-common/sign-verify';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { useServices } from '@trezor/dependency-injection';

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
});

const DEFAULT_VALUES: SignVerifyFields = {
    message: '',
    address: '',
    path: '',
    signature: '',
    hex: false,
};

type UseSignVerifyFormParams = {
    isSignPage: boolean;
    symbol: NetworkSymbol;
    /** The address a network signs with before the user picks one, if it has a single one. */
    defaultAddress?: { path: string; address: string };
};

/**
 * One form per page and account: render it under a key of both, so switching either starts a
 * fresh form from the defaults.
 */
export const useSignVerifyForm = ({
    isSignPage,
    symbol,
    defaultAddress,
}: UseSignVerifyFormParams) => {
    const { addressValidator } = useServices(injectAddressValidator);
    const { register, handleSubmit, formState, reset, setValue, clearErrors, control, trigger } =
        useForm<SignVerifyFields, SignVerifyContext>({
            mode: 'onBlur',
            reValidateMode: 'onChange',
            resolver: yupResolver(signVerifySchema),
            context: {
                addressValidator,
                isSignPage,
                symbol,
            },
            defaultValues: { ...DEFAULT_VALUES, ...defaultAddress },
        });

    const { errors, isSubmitting } = formState;

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

    useEffect(() => {
        if (formValues.message) {
            trigger('message');
        }
    }, [trigger, formValues.message, formValues.hex]);

    useEffect(() => {
        if (isSignPage) {
            setValue('signature', '');
        }
    }, [setValue, isSignPage, formValues.address, formValues.message]);

    return {
        isSubmitting,
        resetForm: () => reset(),
        formSubmit: handleSubmit,
        formValues,
        formErrors: errors,
        formSetSignature: (signature: string) => setValue('signature', signature),
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
        },
    };
};
