import { useEffect } from 'react';
import { useForm, useController } from 'react-hook-form';
import { yup } from '@trezor/validation';
import { isAddressValid } from '@suite-common/wallet-utils';
import { yupResolver } from '@hookform/resolvers/yup';

import type { Account, Network } from 'src/types/wallet';

export const MAX_LENGTH_MESSAGE = 1024;
export const MAX_LENGTH_SIGNATURE = 255;

type SignVerifyContext = {
    isSignPage: boolean;
    accountNetwork: Network['symbol'];
};

const signVerifySchema = yup.object({
    message: yup
        .string()
        .max(MAX_LENGTH_MESSAGE, 'TR_TOO_LONG')
        .required()
        .when('hex', {
            is: true,
            then: schema => schema.isHex(),
            otherwise: schema => schema.isAscii(),
        }),
    address: yup
        .string()
        .test(
            'isAddressValid',
            'TR_ADD_TOKEN_ADDRESS_NOT_VALID',
            (value, { options }) =>
                value &&
                options.context?.accountNetwork &&
                isAddressValid(value, options.context?.accountNetwork),
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
    isElectrum: yup.boolean(),
});

export type SignVerifyFields = yup.InferType<typeof signVerifySchema>;

const DEFAULT_VALUES: SignVerifyFields = {
    message: '',
    address: '',
    isElectrum: false,
    path: '',
    signature: '',
    hex: false,
};

export const useSignVerifyForm = (isSignPage: boolean, account: Account) => {
    const {
        register,
        handleSubmit,
        formState,
        reset,
        setValue,
        clearErrors,
        control,
        trigger,
        watch,
    } = useForm<SignVerifyFields, SignVerifyContext>({
        mode: 'onBlur',
        reValidateMode: 'onChange',
        resolver: yupResolver(signVerifySchema),
        context: {
            isSignPage,
            accountNetwork: account?.symbol,
        },
        defaultValues: DEFAULT_VALUES,
    });

    const { isDirty, errors, isSubmitting } = formState;

    const formValues = watch();

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
    const { field: isElectrumField } = useController({
        control,
        name: 'isElectrum',
    });

    useEffect(() => {
        if (formValues.message) {
            trigger('message');
        }
    }, [trigger, formValues.message, formValues.hex]);

    useEffect(() => {
        if (isSignPage) setValue('signature', '');
    }, [setValue, isSignPage, formValues.address, formValues.message, formValues.isElectrum]);

    useEffect(() => {
        const overrideValues =
            isSignPage && account?.networkType === 'ethereum'
                ? {
                      path: account.path,
                      address: account.descriptor,
                  }
                : {};

        reset({
            ...DEFAULT_VALUES,
            ...overrideValues,
        });
    }, [reset, account, isSignPage]);

    return {
        isFormDirty: isDirty,
        isSubmitting,
        resetForm: () => reset(),
        formSubmit: handleSubmit,
        formValues,
        formErrors: errors,
        formSetSignature: (value: string) => setValue('signature', value),
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
            isDisabled: account?.networkType === 'ethereum',
        },
        isElectrumField: {
            selectedOption: isElectrumField.value,
            onChange: isElectrumField.onChange,
        },
    };
};
