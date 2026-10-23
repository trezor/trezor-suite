import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { type FieldError, useController } from 'react-hook-form';
import { useSelector } from 'react-redux';

import * as yup from 'yup';

import { type ReceiveRootState, selectTouchedAddresses } from '@suite-common/receive';
import { signThunk, verifyThunk } from '@suite-common/sign-verify';
import { type Account } from '@suite-common/wallet-types';
import { Translation, type TranslationKey, useTranslation } from '@suite-lego/intl';
import { Button, Card, Column } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import type {
    MessageSigning,
    SignFormat,
    SignFormatKind,
} from '@trezor/network-module-suite-common-types';
import { injectDispatch } from '@trezor/redux-utils';

import { CapabilityLabel } from './CapabilityLabel';
import { FormatSwitch } from './FormatSwitch';
import { SignVerifyAddressField } from './SignVerifyAddressField';
import { SignVerifyMessageField } from './SignVerifyMessageField';
import { SignVerifyPubKeyField } from './SignVerifyPubKeyField';
import { SignVerifySignatureField } from './SignVerifySignatureField';
import { SignVerifyTabs } from './SignVerifyTabs';
import { type SignVerifyOutcome, type SignVerifyTab } from './types';
import { useSignVerifyCopyValue } from './useSignVerifyCopyValue';
import {
    SIGN_VERIFY_BASE_DEFAULT_VALUES,
    type SignVerifyBaseFields,
    signVerifyBaseSchema,
    useSignVerifyForm,
} from './useSignVerifyForm';

type SignVerifyFields = SignVerifyBaseFields & {
    format?: SignFormat;
    pubKey?: string;
};

const signVerifySchema: yup.ObjectSchema<SignVerifyFields> = yup.object({
    ...signVerifyBaseSchema,
    format: yup.mixed<SignFormat>(),
    pubKey: yup.string(),
});

const DEFAULT_VALUES: SignVerifyFields = {
    ...SIGN_VERIFY_BASE_DEFAULT_VALUES,
    format: undefined,
    pubKey: '',
};

/**
 * How desktop presents each kind of format choice. A signature format only matters until the
 * message is signed; a public key format explains the key shown next to the signature, so it stays.
 * The test ids are the ones the e2e suites already address.
 */
const formatSwitchPresentation = {
    signature: { isShownWhenSigned: false, testId: '@sign-verify/format' },
    publicKey: { isShownWhenSigned: true, testId: '@sign-verify/cardano-pubkey-format' },
} as const satisfies Record<SignFormatKind, { isShownWhenSigned: boolean; testId: string }>;

/** Rich-text tags used by catalog messages that families reference, such as format tooltips. */
const richTextValues = {
    FormatDescription: (chunks: ReactNode) => <p>{chunks}</p>,
    span: (chunks: ReactNode) => <strong>{chunks}</strong>,
};

type SignVerifyFormProps = {
    account: Account;
    messageSigning: MessageSigning;
    isDeviceLocked: boolean;
    page: SignVerifyTab;
    onPageChange: (page: SignVerifyTab) => void;
};

export const SignVerifyForm = ({
    account,
    messageSigning,
    isDeviceLocked,
    page,
    onPageChange,
}: SignVerifyFormProps) => {
    const [outcome, setOutcome] = useState<SignVerifyOutcome>('idle');

    const { dispatch } = useServices(injectDispatch);

    const canVerify = messageSigning.verify !== undefined;
    const isSignPage = page === 'sign';
    const isAddressFixed = messageSigning.addressSelection === 'fixed';

    const touchedAddresses = useSelector((state: ReceiveRootState) =>
        selectTouchedAddresses(state, account.key),
    );
    const addressGroups = useMemo(
        () => messageSigning.getSignAddressGroups({ account, touchedAddresses }),
        [messageSigning, account, touchedAddresses],
    );
    const formatChoice = useMemo(
        () => messageSigning.getFormatChoice(account),
        [messageSigning, account],
    );

    const fixedAddress = isAddressFixed ? addressGroups[0]?.addresses[0] : undefined;
    const overrideValues = useMemo(
        (): Partial<SignVerifyFields> => ({
            format: formatChoice?.options[0]?.format,
            ...(isSignPage && fixedAddress !== undefined
                ? { path: fixedAddress.path, address: fixedAddress.address }
                : {}),
        }),
        [formatChoice, isSignPage, fixedAddress],
    );

    const {
        control,
        register,
        isSubmitting,
        resetForm,
        formSubmit,
        formValues,
        formErrors,
        setValue,
        hexField,
        addressField,
        pathField,
    } = useSignVerifyForm<SignVerifyFields>({
        account,
        isSignPage,
        schema: signVerifySchema,
        defaultValues: DEFAULT_VALUES,
        overrideValues,
        isPathDisabled: isAddressFixed,
        resultFields: ['signature', 'pubKey'],
        signedInputFields: ['address', 'message', 'format'],
    });

    const { field: formatField } = useController({ control, name: 'format' });

    const { translationString } = useTranslation();
    const copyValue = useSignVerifyCopyValue();

    const isCompleted = outcome === 'signed' || outcome === 'verified';
    const hasFailedVerification = outcome === 'failed';
    const formatPresentation = formatChoice && formatSwitchPresentation[formatChoice.kind];
    const isFormatSwitchShown =
        isSignPage &&
        formatPresentation !== null &&
        (formatPresentation.isShownWhenSigned || !isCompleted);

    const getErrorMessage = (error?: FieldError) =>
        error ? translationString(error.message as TranslationKey) : undefined;

    const verificationInputs = [
        formValues.message,
        formValues.address,
        formValues.signature,
        formValues.hex,
    ].join('\u0000');

    // A failed verification is the only outcome that leaves the form editable, and it comes with no
    // Clear button, so editing the values it was about is the only way out of it.
    useEffect(() => {
        setOutcome(prev => (prev === 'failed' ? 'idle' : prev));
    }, [verificationInputs]);

    // Every button inside the form has to cancel the click, otherwise it submits the form.
    const clearForm = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        resetForm();
        setOutcome('idle');
    };

    const onSubmit = async (data: SignVerifyFields) => {
        const { address, path, message, signature, hex, format } = data;

        if (isSignPage && path !== undefined) {
            const result = await dispatch(
                signThunk({ account, path, message, isHex: hex, format }),
            );

            if (result) {
                setValue('signature', result.signature);
                setValue('pubKey', result.publicKey ?? '');
                setOutcome('signed');
            }
        } else if (signature !== undefined) {
            const result = await dispatch(
                verifyThunk({ account, address, message, signature, isHex: hex }),
            );

            // Cancelling on the device leaves the form exactly as it was, the way a cancelled
            // signing does: nothing was verified, and nothing failed to verify either.
            if (result !== 'cancelled') {
                setOutcome(result === 'verified' ? 'verified' : 'failed');
            }
        }
    };

    return (
        <Card>
            <SignVerifyTabs
                page={page}
                canVerify={canVerify}
                outcome={outcome}
                onPageChange={onPageChange}
            />
            <form onSubmit={formSubmit(onSubmit)}>
                <Column gap={16} margin={{ bottom: 32 }}>
                    {isFormatSwitchShown && formatChoice !== null && (
                        <FormatSwitch
                            label={<CapabilityLabel label={formatChoice.label} />}
                            options={formatChoice.options.map(option => ({
                                value: option.format,
                                label: <CapabilityLabel label={option.label} />,
                            }))}
                            tooltip={
                                formatChoice.tooltip && (
                                    <CapabilityLabel
                                        label={formatChoice.tooltip}
                                        values={richTextValues}
                                    />
                                )
                            }
                            isDisabled={isCompleted}
                            data-testid={formatSwitchPresentation[formatChoice.kind].testId}
                            selectedOption={formatField.value}
                            onChange={formatField.onChange}
                        />
                    )}
                    <SignVerifyAddressField
                        addressGroups={addressGroups}
                        isAddressFixed={isAddressFixed}
                        isSignPage={isSignPage}
                        isCompleted={isCompleted}
                        address={formValues.address}
                        pathField={pathField}
                        addressField={addressField}
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
                        hexField={hexField}
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
                    {isSignPage && messageSigning.outputs.includes('publicKey') && (
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
                        isDisabled={isDeviceLocked}
                        isLoading={isSubmitting}
                        data-testid="@sign-verify/submit"
                        minWidth={200}
                    >
                        <Translation id={isSignPage ? 'TR_SIGN' : 'TR_VERIFY'} />
                    </Button>
                )}
            </form>
        </Card>
    );
};
