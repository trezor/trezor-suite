import { useEffect } from 'react';
import { useController, useForm } from 'react-hook-form';

import { yupResolver } from '@hookform/resolvers/yup';

import { yup } from '@suite-common/validators';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { isAddressValid } from '@suite-common/wallet-utils';

import type { Account } from 'src/types/wallet';

export const MAX_LENGTH_MESSAGE = 1024;
export const MAX_LENGTH_SIGNATURE = 255;

type SignVerifyContext = {
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
    isElectrum?: boolean;
    pubKey?: string;
    cardanoPubKeyCose?: boolean;
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
                value && options.context?.symbol && isAddressValid(value, options.context?.symbol),
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
    pubKey: yup.string(),
    cardanoPubKeyCose: yup.boolean(),
});

const DEFAULT_VALUES: SignVerifyFields = {
    message: '',
    address: '',
    isElectrum: false,
    path: '',
    signature: '',
    hex: false,
    pubKey: '',
    cardanoPubKeyCose: false,
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
            symbol: account?.symbol,
        },
        defaultValues: DEFAULT_VALUES,
    });

    const { isDirty, errors, isSubmitting } = formState;

    // eslint-disable-next-line react-hooks/incompatible-library -- react-hook-form; see plans/react-compiler-follow-ups.md
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
    const { field: cardanoPubKeyCoseField } = useController({
        control,
        name: 'cardanoPubKeyCose',
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
    }, [
        setValue,
        isSignPage,
        formValues.address,
        formValues.message,
        formValues.isElectrum,
        formValues.cardanoPubKeyCose,
    ]);

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
        formSetSignature: ({ signature, pubKey }: { signature: string; pubKey?: string }) => {
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
            isDisabled: account?.networkType === 'ethereum',
        },
        isElectrumField: {
            selectedOption: isElectrumField.value,
            onChange: isElectrumField.onChange,
        },
        cardanoPubKeyCoseField: {
            selectedOption: cardanoPubKeyCoseField.value,
            onChange: cardanoPubKeyCoseField.onChange,
        },
    };
};
