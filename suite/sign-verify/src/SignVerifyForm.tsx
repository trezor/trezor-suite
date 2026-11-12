import { type ReactNode, useEffect, useState } from 'react';
import { type FieldError } from 'react-hook-form';

import { useDevice } from '@suite/device';
import { CapabilityLabel, Translation, type TranslationKey, useTranslation } from '@suite/intl';
import { type MessageSigningController } from '@suite-common/sign-verify';
import { type Account } from '@suite-common/wallet-types';
import { Button, Card, Column } from '@trezor/components';
import type { SignChoiceKind } from '@trezor/network-module-suite-common-types';

import { FormatSwitch } from './FormatSwitch';
import { SignVerifyAddressField } from './SignVerifyAddressField';
import { SignVerifyMessageField } from './SignVerifyMessageField';
import { SignVerifyPubKeyField } from './SignVerifyPubKeyField';
import { SignVerifySignatureField } from './SignVerifySignatureField';
import { SignVerifyTabs } from './SignVerifyTabs';
import { type SignVerifyOutcome, type SignVerifyPage } from './types';
import { useSignVerifyCopyValue } from './useSignVerifyCopyValue';
import { type SignVerifyFields, useSignVerifyForm } from './useSignVerifyForm';

/**
 * How desktop presents each kind of choice. A signature format only matters until the message is
 * signed; a public key format explains the key shown next to the signature, so it stays. The test
 * ids are the ones the e2e suites already address.
 */
const choicePresentation = {
    signature: { isShownWhenSigned: false, testId: '@sign-verify/format' },
    publicKey: { isShownWhenSigned: true, testId: '@sign-verify/cardano-pubkey-format' },
} as const satisfies Record<SignChoiceKind, { isShownWhenSigned: boolean; testId: string }>;

/** Rich-text tags used by catalog messages that families reference, such as format tooltips. */
const richTextValues = {
    FormatDescription: (chunks: ReactNode) => <p>{chunks}</p>,
    span: (chunks: ReactNode) => <strong>{chunks}</strong>,
};

export type SignVerifyFormProps = {
    account: Account;
    signing: MessageSigningController;
    page: SignVerifyPage;
    onPageChange: (page: SignVerifyPage) => void;
};

/**
 * The form every network gets unless the app overrides it: it renders from the network's message
 * signing and never branches on the network itself.
 */
export const SignVerifyForm = ({ account, signing, page, onPageChange }: SignVerifyFormProps) => {
    const [outcome, setOutcome] = useState<SignVerifyOutcome>('idle');

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
        selectionField,
    } = useSignVerifyForm(isSignPage, account, signing);

    const { isLocked } = useDevice();
    const { translationString } = useTranslation();
    const copyValue = useSignVerifyCopyValue();

    const isCompleted = outcome === 'signed' || outcome === 'verified';
    const hasFailedVerification = outcome === 'failed';
    const shownChoices = isSignPage
        ? signing.choices.filter(
              ({ kind }) => choicePresentation[kind].isShownWhenSigned || !isCompleted,
          )
        : [];

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
        const { address, path, message, signature, hex, selection } = data;

        if (isSignPage && path !== undefined) {
            const result = await signing.sign({ path, message, isHex: hex, selection });

            if (result) {
                formSetSignature({ signature: result.signature, pubKey: result.publicKey });
                setOutcome('signed');
            }
        } else if (signature !== undefined) {
            const result = await signing.verify({ address, message, signature, isHex: hex });

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
                canVerify={signing.canVerify}
                outcome={outcome}
                onPageChange={onPageChange}
            />
            <form onSubmit={formSubmit(onSubmit)}>
                <Column gap={16} margin={{ bottom: 32 }}>
                    {shownChoices.map(choice => (
                        <FormatSwitch
                            key={choice.key}
                            label={<CapabilityLabel label={choice.label} />}
                            options={choice.options.map(option => ({
                                value: option.id,
                                label: <CapabilityLabel label={option.label} />,
                            }))}
                            tooltip={
                                choice.tooltip && (
                                    <CapabilityLabel
                                        label={choice.tooltip}
                                        values={richTextValues}
                                    />
                                )
                            }
                            isDisabled={isCompleted}
                            data-testid={choicePresentation[choice.kind].testId}
                            selectedOption={
                                selectionField.value[choice.key] ?? choice.options[0]?.id
                            }
                            onChange={id =>
                                selectionField.onChange({
                                    ...selectionField.value,
                                    [choice.key]: id,
                                })
                            }
                        />
                    ))}
                    <SignVerifyAddressField
                        addressGroups={signing.addressGroups}
                        isAddressFixed={signing.isAddressFixed}
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
                    {isSignPage && signing.hasPublicKeyOutput && (
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
