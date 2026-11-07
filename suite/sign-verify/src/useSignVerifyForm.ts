import { useEffect, useMemo } from 'react';
import { useController, useForm, useWatch } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { type AddressValidator, injectAddressValidator } from '@suite-common/networks';
import { MAX_LENGTH_MESSAGE } from '@suite-common/sign-verify';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { useServices } from '@trezor/dependency-injection';
import { isHex } from '@trezor/utils';

export type SignVerifyFormFields = ReturnType<typeof useSignVerifyForm>;

type GetSignVerifySchemaParams = {
    addressValidator: AddressValidator;
    isSignPage: boolean;
    symbol?: NetworkSymbol;
};

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

// Messages are translation keys, rendered via `translationString`.
const getSignVerifySchema = ({ addressValidator, isSignPage, symbol }: GetSignVerifySchemaParams) =>
    z
        .object({
            message: z
                .string('TR_REQUIRED_FIELD')
                .max(MAX_LENGTH_MESSAGE, 'TR_TOO_LONG')
                .min(1, 'TR_REQUIRED_FIELD'),
            address: z
                .string('TR_REQUIRED_FIELD')
                .refine(
                    address =>
                        !!address && !!symbol && addressValidator.isAddressValid(address, symbol),
                    'TR_ADD_TOKEN_ADDRESS_NOT_VALID',
                ),
            path: z
                .string()
                .optional()
                .refine(path => !isSignPage || !!path, 'TR_REQUIRED_FIELD'),
            signature: z
                .string()
                .optional()
                .refine(signature => isSignPage || !!signature, 'TR_REQUIRED_FIELD'),
            hex: z.boolean('TR_REQUIRED_FIELD'),
            isElectrum: z.boolean().optional(),
            pubKey: z.string().optional(),
            cardanoPubKeyCose: z.boolean().optional(),
        })
        .superRefine(({ message, hex }, context) => {
            if (hex && !isHex(message, { prefix: 'optional', allowEmpty: false })) {
                context.addIssue({
                    code: 'custom',
                    path: ['message'],
                    message: 'DATA_NOT_VALID_HEX',
                });
            }
        }) satisfies z.ZodType<SignVerifyFields>;

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
    const { addressValidator } = useServices(injectAddressValidator);
    const signVerifySchema = useMemo(
        () => getSignVerifySchema({ addressValidator, isSignPage, symbol: account?.symbol }),
        [addressValidator, isSignPage, account?.symbol],
    );
    const { register, handleSubmit, formState, reset, setValue, clearErrors, control, trigger } =
        useForm<SignVerifyFields>({
            mode: 'onBlur',
            reValidateMode: 'onChange',
            resolver: zodResolver(signVerifySchema),
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
    }, [reset, isSignPage, account?.key, account?.networkType, account?.path, account?.descriptor]);
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
