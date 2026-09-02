import { useEffect, useState } from 'react';
import { type FieldError } from 'react-hook-form';

import { useDevice } from '@suite/device';
import { Translation, type TranslationKey, useTranslation } from '@suite/intl';
import { useDispatch } from '@suite-common/redux-utils';
import { type Network } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { Button, Card, Column } from '@trezor/components';

import { FormatSwitch } from './FormatSwitch';
import { SignVerifyAddressField } from './SignVerifyAddressField';
import { SignVerifyMessageField } from './SignVerifyMessageField';
import { SignVerifyPubKeyField } from './SignVerifyPubKeyField';
import { SignVerifySignatureField } from './SignVerifySignatureField';
import { SignVerifyTabs } from './SignVerifyTabs';
import { isVerifySupported, signThunk, verifyThunk } from './signVerifyActions';
import { getHasSelectableSignatureFormat } from './signVerifyUtils';
import { type SignVerifyOutcome, type SignVerifyPage } from './types';
import { useSignVerifyCopyValue } from './useSignVerifyCopyValue';
import { type SignVerifyFields, useSignVerifyForm } from './useSignVerifyForm';

type SignVerifyFormProps = {
    account: Account;
    network?: Network;
    page: SignVerifyPage;
    onPageChange: (page: SignVerifyPage) => void;
};

export const SignVerifyForm = ({ account, network, page, onPageChange }: SignVerifyFormProps) => {
    const [outcome, setOutcome] = useState<SignVerifyOutcome>('idle');

    const dispatch = useDispatch();

    const isSignPage = page === 'sign';

    const {
        register,
        isSubmitting,
        resetForm,
        formSubmit,
        formValues,
        formErrors,
        formSetSignature,
        hexField,
        addressField,
        pathField,
        isElectrumField,
        cardanoPubKeyCoseField,
    } = useSignVerifyForm(isSignPage, account);

    const { isLocked } = useDevice();
    const { translationString } = useTranslation();
    const copyValue = useSignVerifyCopyValue();

    const isCompleted = outcome === 'signed' || outcome === 'verified';
    const hasFailedVerification = outcome === 'failed';

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
        setOutcome(prev => {
            if (prev === 'failed') {
                return 'idle';
            }

            return prev;
        });
    }, [verificationInputs]);

    // Every button inside the form has to cancel the click, otherwise it submits the form.
    const clearForm = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        resetForm();
        setOutcome('idle');
    };

    const onSubmit = async (data: SignVerifyFields) => {
        const { address, path, message, signature, hex, isElectrum, cardanoPubKeyCose } = data;

        if (isSignPage && path !== undefined) {
            const result = await dispatch(
                signThunk(account, path, message, hex, isElectrum, cardanoPubKeyCose),
            );

            if (result) {
                formSetSignature(result);
                setOutcome('signed');
            }
        } else if (signature !== undefined) {
            const result = await dispatch(verifyThunk(account, address, message, signature, hex));

            setOutcome(result ? 'verified' : 'failed');
        }
    };

    const signFormatsDiffer = getHasSelectableSignatureFormat(account);
    const canVerify = isVerifySupported(account);
    const isCardano = network?.networkType === 'cardano';

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
                    {isSignPage && signFormatsDiffer && !isCompleted && (
                        <FormatSwitch
                            options={[
                                { value: false, label: <Translation id="TR_BIP_SIG_FORMAT" /> },
                                {
                                    value: true,
                                    label: <Translation id="TR_COMPATIBILITY_SIG_FORMAT" />,
                                },
                            ]}
                            tooltip={
                                <Translation
                                    id="TR_FORMAT_TOOLTIP"
                                    values={{
                                        FormatDescription: chunks => <p>{chunks}</p>,
                                        span: chunks => <strong>{chunks}</strong>,
                                    }}
                                />
                            }
                            data-testid="@sign-verify/format"
                            {...isElectrumField}
                        />
                    )}
                    {isSignPage && isCardano && (
                        <FormatSwitch
                            options={[
                                { value: false, label: <Translation id="TR_PUBLIC_KEY_RAW" /> },
                                { value: true, label: <Translation id="TR_PUBLIC_KEY_COSE" /> },
                            ]}
                            isDisabled={isCompleted}
                            data-testid="@sign-verify/cardano-pubkey-format"
                            {...cardanoPubKeyCoseField}
                        />
                    )}
                    <SignVerifyAddressField
                        account={account}
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
        </Card>
    );
};
