import { useEffect, useRef } from 'react';
import {
    type DefaultValues,
    type Path,
    type Resolver,
    useController,
    useForm,
    useWatch,
} from 'react-hook-form';

import { yupResolver } from '@hookform/resolvers/yup';

import { useServices } from '@suite-common/dependency-injection';
import { type AddressValidator, selectAddressValidatorDep } from '@suite-common/networks';
import { yup } from '@suite-common/validators';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';

export const MAX_LENGTH_MESSAGE = 1024;
export const MAX_LENGTH_SIGNATURE = 255;

type SignVerifyContext = {
    addressValidator: AddressValidator;
    isSignPage: boolean;
    symbol: NetworkSymbol;
};

/** The fields every network signs and verifies with; networks add their own on top. */
export type SignVerifyBaseFields = {
    message: string;
    address: string;
    hex: boolean;
    path?: string;
    signature?: string;
};

// yup doesn't type properly conditionally required fields → need to declare type rather than infer it
export const signVerifyBaseSchema = {
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
};

export const SIGN_VERIFY_BASE_DEFAULT_VALUES: SignVerifyBaseFields = {
    message: '',
    address: '',
    path: '',
    signature: '',
    hex: false,
};

type UseSignVerifyFormOptions<TFields extends SignVerifyBaseFields> = {
    account: Account;
    isSignPage: boolean;
    schema: yup.ObjectSchema<TFields>;
    defaultValues: TFields;
    /** Values the network pins on the sign page, such as Ethereum's single address. */
    overrideValues?: Partial<TFields>;
    isPathDisabled?: boolean;
    /** Fields carrying the signing result, dropped whenever the signed inputs change. */
    resultFields?: Path<TFields>[];
    /** Fields the result was produced from; changing any of them invalidates it. */
    signedInputFields?: Path<TFields>[];
};

export const useSignVerifyForm = <TFields extends SignVerifyBaseFields>({
    account,
    isSignPage,
    schema,
    defaultValues,
    overrideValues,
    isPathDisabled = false,
    resultFields = [],
    signedInputFields = [],
}: UseSignVerifyFormOptions<TFields>) => {
    const { addressValidator } = useServices(selectAddressValidatorDep);
    const { register, handleSubmit, formState, reset, setValue, clearErrors, control, trigger } =
        useForm<TFields, SignVerifyContext>({
            mode: 'onBlur',
            reValidateMode: 'onChange',
            resolver: yupResolver(schema) as Resolver<TFields, SignVerifyContext, TFields>,
            context: {
                addressValidator,
                isSignPage,
                symbol: account.symbol,
            },
            defaultValues: defaultValues as DefaultValues<TFields>,
        });

    const { isDirty, errors, isSubmitting } = formState;

    const formValues = useWatch({ control });

    // The controllers below are addressed by a generic field name, so react-hook-form widens their
    // value to the union of every field's type; `SignVerifyBaseFields` pins what they really are.
    const { field: addressField } = useController({ control, name: 'address' as Path<TFields> });
    const { field: pathField } = useController({ control, name: 'path' as Path<TFields> });
    const { field: hexField } = useController({ control, name: 'hex' as Path<TFields> });

    useEffect(() => {
        if (formValues.message) {
            trigger('message' as Path<TFields>);
        }
    }, [trigger, formValues.message, formValues.hex]);

    // The effects below are keyed on serialized values, so the field lists they read are held in
    // refs rather than compared by identity — callers build them inline on every render.
    const resultFieldsRef = useRef(resultFields);
    resultFieldsRef.current = resultFields;

    const signedInputsKey = JSON.stringify(
        signedInputFields.map(field => formValues[field as keyof typeof formValues]),
    );

    useEffect(() => {
        if (isSignPage) {
            resultFieldsRef.current.forEach(field => setValue(field, '' as never));
        }
    }, [setValue, isSignPage, signedInputsKey]);

    const overrideValuesRef = useRef(overrideValues);
    overrideValuesRef.current = overrideValues;

    const overrideValuesKey = JSON.stringify(overrideValues ?? {});

    useEffect(() => {
        reset({
            ...defaultValues,
            ...overrideValuesRef.current,
        });
    }, [reset, defaultValues, isSignPage, account.key, overrideValuesKey]);

    return {
        control,
        isFormDirty: isDirty,
        isSubmitting,
        resetForm: () => reset(),
        formSubmit: handleSubmit,
        formValues,
        formErrors: errors,
        setValue,
        register,
        hexField: {
            isChecked: hexField.value as boolean,
            onChange: hexField.onChange,
        },
        addressField: {
            value: addressField.value as string,
            onChange: addressField.onChange,
            onBlur: addressField.onBlur,
        },
        pathField: {
            value: pathField.value as string,
            onBlur: pathField.onBlur,
            onChange: (addr: { path: string; address: string } | null) => {
                clearErrors(['path', 'address'] as Path<TFields>[]);
                pathField.onChange(addr?.path || '');
                addressField.onChange(addr?.address || '');
            },
            isDisabled: isPathDisabled,
        },
    };
};

export type SignVerifyFormFields = ReturnType<typeof useSignVerifyForm<SignVerifyBaseFields>>;
