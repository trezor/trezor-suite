import { useEffect, useCallback } from 'react';
import { useForm, useController } from 'react-hook-form';
import { useTranslation, useSelector, useActions } from '@suite-hooks';
import * as protocolActions from '@suite-actions/protocolActions';
import { isHex } from '@wallet-utils/ethUtils';
import { isASCII } from '@suite-utils/validators';
import { isAddressValid } from '@wallet-utils/validation';
import type { Account } from '@wallet-types';
import type { AoppState } from '@suite-reducers/protocolReducer';

export const MAX_LENGTH_MESSAGE = 1024;
export const MAX_LENGTH_SIGNATURE = 255;

export type SignVerifyFields = {
    message: string;
    address: string;
    path: string;
    signature: string;
    hex: boolean;
    aopp: boolean;
    callback: string;
};

const DEFAULT_VALUES: SignVerifyFields = {
    message: '',
    address: '',
    path: '',
    signature: '',
    hex: false,
    aopp: false,
    callback: '',
};

const useAoppListener = (account: Account | undefined, setAopp: (aopp: AoppState) => void) => {
    const { aoppState } = useSelector(state => ({
        aoppState: state.protocol.aopp,
    }));

    const { fillAopp } = useActions({
        fillAopp: protocolActions.fillAopp,
    });

    const shouldFill = useCallback(
        (aopp: typeof aoppState): aopp is AoppState =>
            !!aopp.shouldFill && !!aopp.message && aopp.asset === account?.symbol,
        [account],
    );

    useEffect(() => {
        if (shouldFill(aoppState)) {
            setAopp(aoppState);
            fillAopp(false);
        }
    }, [aoppState, shouldFill, fillAopp, setAopp]);
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
        defaultValues: DEFAULT_VALUES,
    });

    const formValues = watch();

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

    register('aopp');
    register('callback');

    const messageRef = register({
        maxLength: {
            value: MAX_LENGTH_MESSAGE,
            message: translationString('TR_TOO_LONG'),
        },
        validate: {
            hex: (message: string) =>
                formValues.hex && !isHex(message)
                    ? translationString('DATA_NOT_VALID_HEX')
                    : undefined,
            ascii: (message: string) =>
                !formValues.hex && !isASCII(message)
                    ? translationString('TR_ASCII_ONLY')
                    : undefined,
        },
    });

    const signatureRef = register({
        required: {
            value: page === 'verify',
            message: translationString('TR_SELL_VALIDATION_ERROR_EMPTY'),
        },
    });

    useEffect(() => {
        if (control?.fieldsRef?.current?.message) trigger('message');
    }, [trigger, formValues.message, formValues.hex, control?.fieldsRef]);

    useEffect(() => {
        if (page === 'sign') setValue('signature', '');
    }, [setValue, page, formValues.address, formValues.message]);

    useEffect(() => {
        const overrideValues =
            page === 'sign' && account?.networkType === 'ethereum'
                ? {
                      path: account.path,
                      address: account.descriptor,
                  }
                : {};
        reset({
            ...DEFAULT_VALUES,
            ...overrideValues,
        });
    }, [reset, account, page]);

    const formSetAopp = (aopp: AoppState) => {
        setValue('aopp', !!aopp);
        setValue('callback', aopp?.callback ?? '');
        setValue('message', aopp?.message ?? '');
    };

    useAoppListener(account, formSetAopp);

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
        formSetAopp,
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
            isDisabled: account?.networkType === 'ethereum',
        },
    };
};
