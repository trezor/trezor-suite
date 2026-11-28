import { use, useEffect } from 'react';
import { type FieldError, useController, useForm, useWatch } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';

import { useDevice } from '@suite/device';
import { Translation, type TranslationKey, useTranslation } from '@suite/intl';
import { type AddressValidator, injectAddressValidator } from '@suite-common/networks';
import { MAX_LENGTH_MESSAGE, injectSignVerify } from '@suite-common/sign-verify';
import { notificationsActions } from '@suite-common/toast-notifications';
import { type Network, type NetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { Button, Column } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { copyToClipboard } from '@trezor/dom-utils';
import { type SignatureFormat } from '@trezor/network-module-suite-common-types';
import { injectDispatch } from '@trezor/redux-utils';
import { exhaustive } from '@trezor/type-utils';
import { isHex, throwError } from '@trezor/utils';
import { z } from '@trezor/zod';

import { FormatSwitch } from './FormatSwitch';
import { SignVerifyAddressField } from './SignVerifyAddressField';
import { SignVerifyContext } from './SignVerifyContext';
import { SignVerifyMessageField } from './SignVerifyMessageField';
import { SignVerifyPubKeyField } from './SignVerifyPubKeyField';
import { SignVerifySignatureField } from './SignVerifySignatureField';

type SignVerifyContext = {
    addressValidator: AddressValidator;
    isSignPage: boolean;
    symbol: NetworkSymbol;
};

type SignVerifyFields = {
    message: string;
    address: string;
    hex: boolean;
    path?: string;
    signature?: string;
    format?: SignatureFormat;
    pubKey?: string;
};

const REQUIRED: TranslationKey = 'TR_REQUIRED_FIELD';

const requiredString = z.string().min(1, REQUIRED);

const createSignVerifySchema = ({ addressValidator, isSignPage, symbol }: SignVerifyContext) =>
    z
        .object({
            message: z
                .string()
                .max(MAX_LENGTH_MESSAGE, 'TR_TOO_LONG' satisfies TranslationKey)
                .min(1, REQUIRED),
            address: z
                .string()
                .refine(
                    value => addressValidator.isAddressValid(symbol, value),
                    'TR_ADD_TOKEN_ADDRESS_NOT_VALID' satisfies TranslationKey,
                ),
            path: (isSignPage ? requiredString : z.string()).optional(),
            signature: (isSignPage ? z.string() : requiredString).optional(),
            hex: z.boolean(),
            format: z.custom<SignatureFormat>().optional(),
            pubKey: z.string().optional(),
        })
        .refine(
            ({ message, hex }) =>
                !hex || message === '' || isHex(message, { prefix: 'optional', allowEmpty: false }),
            {
                message: 'DATA_NOT_VALID_HEX' satisfies TranslationKey,
                path: ['message'],
                // The hex check needs the Hex switch next to the message, so it must not wait for the other fields.
                when: () => true,
            },
        );

const DEFAULT_VALUES: SignVerifyFields = {
    message: '',
    address: '',
    path: '',
    signature: '',
    hex: false,
    pubKey: '',
};

type SignVerifyFormProps = {
    account: Account;
    network?: Network;
};

export const SignVerifyForm = ({ account, network }: SignVerifyFormProps) => {
    const { page, outcome, setOutcome } =
        use(SignVerifyContext) ?? throwError('Missing SignVerify');

    const { signVerify } = useServices(injectSignVerify);
    const { addressValidator } = useServices(injectAddressValidator);
    const { dispatch } = useServices(injectDispatch);

    const isSignPage = page === 'sign';
    const defaultFormat = signVerify.getDefaultFormat(account);

    const {
        register,
        handleSubmit,
        formState: { errors: formErrors, isSubmitting },
        reset,
        setValue,
        clearErrors,
        control,
        trigger,
    } = useForm<SignVerifyFields, SignVerifyContext>({
        mode: 'onBlur',
        reValidateMode: 'onChange',
        resolver: (values, context, options) =>
            zodResolver(
                createSignVerifySchema(context ?? throwError('Missing sign & verify context')),
            )(values, context, options),
        context: {
            addressValidator,
            isSignPage,
            symbol: account.symbol,
        },
        defaultValues: { ...DEFAULT_VALUES, format: defaultFormat },
    });

    const formValues = useWatch({ control });

    const { field: addressField } = useController({ control, name: 'address' });
    const { field: pathField } = useController({ control, name: 'path' });
    const { field: hexField } = useController({ control, name: 'hex' });
    const { field: formatField } = useController({ control, name: 'format' });

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

    useEffect(() => {
        const overrideValues =
            isSignPage && account.networkType === 'ethereum'
                ? {
                      path: account.path,
                      address: account.descriptor,
                  }
                : {};

        reset({
            ...DEFAULT_VALUES,
            format: defaultFormat,
            ...overrideValues,
        });
    }, [
        reset,
        isSignPage,
        account.key,
        account.networkType,
        account.path,
        account.descriptor,
        defaultFormat,
    ]);

    const { device, isLocked } = useDevice();
    const { translationString } = useTranslation();

    const copyValue = async (value: string) => {
        const result = await copyToClipboard(value);

        if (typeof result !== 'string') {
            dispatch(notificationsActions.addToast({ type: 'copy-to-clipboard' }));
        }
    };

    const isCompleted = outcome === 'signed' || outcome === 'verified';
    const hasFailedVerification = outcome === 'failed';

    const getErrorMessage = (error?: FieldError) =>
        error ? translationString(error.message as TranslationKey) : undefined;

    // A failed verification comes with no Clear button, editing the values is the way out.
    const leaveFailedOutcome = () => {
        if (outcome === 'failed') {
            setOutcome(page, 'idle');
        }
    };

    // Every button inside the form has to cancel the click, otherwise it submits the form.
    const clearForm = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        reset();
        setOutcome(page, 'idle');
    };

    const onSubmit = async (data: SignVerifyFields) => {
        const { address, path, message, signature, hex, format } = data;

        if (isSignPage && path !== undefined) {
            const result = await signVerify.sign({
                device,
                account,
                path,
                message,
                hex,
                format,
            });

            if (result.success) {
                setValue('signature', result.payload.signature);
                setValue('pubKey', result.payload.pubKey || '');
                setOutcome(page, 'signed');
            }
        } else if (signature !== undefined) {
            const result = await signVerify.verify({
                device,
                account,
                address,
                message,
                signature,
                hex,
            });

            if (result.success) {
                setOutcome(page, 'verified');

                return;
            }

            switch (result.error.type) {
                // Cancelling on the device leaves the form exactly as it was, the way a cancelled
                // signing does: nothing was verified, and nothing failed to verify either.
                case 'DeviceCancelled':
                    break;
                case 'DeviceError':
                case 'DeviceNotConnectedError':
                case 'SignVerifyNotSupported':
                    setOutcome(page, 'failed');
                    break;
                default:
                    exhaustive(result.error);
            }
        }
    };

    const formats = signVerify.getFormats(account);
    const isCardano = network?.networkType === 'cardano';

    return (
        <form onSubmit={handleSubmit(onSubmit)} onChange={leaveFailedOutcome}>
            <Column gap={16} margin={{ bottom: 32 }}>
                {isSignPage && formats.length > 1 && (
                    <FormatSwitch
                        options={formats}
                        isDisabled={isCompleted}
                        selectedOption={formatField.value}
                        onChange={formatField.onChange}
                    />
                )}
                <SignVerifyAddressField
                    account={account}
                    isSignPage={isSignPage}
                    isCompleted={isCompleted}
                    address={formValues.address}
                    pathField={{
                        value: pathField.value,
                        onBlur: pathField.onBlur,
                        onChange: addr => {
                            clearErrors(['path', 'address']);
                            pathField.onChange(addr?.path || '');
                            addressField.onChange(addr?.address || '');
                        },
                        isDisabled: account.networkType === 'ethereum',
                    }}
                    addressField={{
                        value: addressField.value,
                        onChange: addressField.onChange,
                        onBlur: addressField.onBlur,
                    }}
                    pathError={getErrorMessage(formErrors.path)}
                    addressError={getErrorMessage(formErrors.address)}
                    hasPathError={!!formErrors.path}
                    hasAddressError={!!formErrors.address || hasFailedVerification}
                    onCopy={copyValue}
                />
                <SignVerifyMessageField
                    message={formValues.message}
                    isCompleted={isCompleted}
                    hasError={!!formErrors.message || hasFailedVerification}
                    errorMessage={getErrorMessage(formErrors.message)}
                    hexField={{ isChecked: hexField.value, onChange: hexField.onChange }}
                    registration={register('message')}
                    onCopy={copyValue}
                />
                <SignVerifySignatureField
                    signature={formValues.signature}
                    isSignPage={isSignPage}
                    isCompleted={isCompleted}
                    hasError={!!formErrors.signature || hasFailedVerification}
                    errorMessage={getErrorMessage(formErrors.signature)}
                    registration={register('signature')}
                    onCopy={copyValue}
                />
                {isSignPage && isCardano && (
                    <SignVerifyPubKeyField
                        pubKey={formValues.pubKey}
                        isCompleted={isCompleted}
                        hasError={!!formErrors.pubKey}
                        errorMessage={getErrorMessage(formErrors.pubKey)}
                        registration={register('pubKey')}
                        onCopy={copyValue}
                    />
                )}
            </Column>
            {isCompleted ? (
                <Button
                    type="button"
                    intent="neutral"
                    priority="secondary"
                    onClick={clearForm}
                    data-testid="@sign-verify/clear"
                    minWidth={200}
                >
                    <Translation id="TR_CLEAR" />
                </Button>
            ) : (
                <Button
                    type="submit"
                    intent="brand"
                    isDisabled={isLocked()}
                    isLoading={isSubmitting}
                    data-testid="@sign-verify/submit"
                    minWidth={200}
                >
                    <Translation id={isSignPage ? 'TR_SIGN' : 'TR_VERIFY'} />
                </Button>
            )}
        </form>
    );
};
