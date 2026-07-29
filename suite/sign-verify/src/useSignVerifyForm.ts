import { useEffect } from 'react';
import { useController, useForm, useWatch } from 'react-hook-form';

import { yupResolver } from '@hookform/resolvers/yup';

import { type AddressValidator, selectAddressValidatorDep } from '@suite-common/address';
import { useServices } from '@suite-common/dependency-injection';
import { yup } from '@suite-common/validators';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';

import type { SignVerifyNetworkConfig } from './types';

export const MAX_LENGTH_MESSAGE = 1024;
export const MAX_LENGTH_SIGNATURE = 255;

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
    signOption?: boolean;
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
    signOption: yup.boolean(),
});

const DEFAULT_VALUES: SignVerifyFields = {
    message: '',
    address: '',
    signOption: false,
    path: '',
    signature: '',
    hex: false,
};

export const useSignVerifyForm = (
    isSignPage: boolean,
    account: Account,
    networkConfig: SignVerifyNetworkConfig,
) => {
    const { addressValidator } = useServices(selectAddressValidatorDep);
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
    const { field: signOptionField } = useController({
        control,
        name: 'signOption',
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
    }, [setValue, isSignPage, formValues.address, formValues.message, formValues.signOption]);

    useEffect(() => {
        const overrideValues = networkConfig.getInitialValues?.(account, isSignPage) ?? {};

        reset({
            ...DEFAULT_VALUES,
            ...overrideValues,
        });
    }, [reset, account, isSignPage, networkConfig]);

    return {
        isFormDirty: isDirty,
        isSubmitting,
        resetForm: () => reset(),
        formSubmit: handleSubmit,
        formValues,
        formErrors: errors,
        formSetSignature: ({ signature }: { signature: string }) => {
            setValue('signature', signature);
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
            isDisabled: networkConfig.isPathDisabled?.(account) ?? false,
        },
        signOptionField: {
            selectedOption: signOptionField.value,
            onChange: signOptionField.onChange,
        },
    };
};
