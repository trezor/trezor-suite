import { useEffect, useState } from 'react';
import { type FieldError } from 'react-hook-form';

import { type TranslationKey, useTranslation } from '@suite/intl';
import { type VerifyMessageResult } from '@suite-common/sign-verify';
import { type NetworkSymbol } from '@suite-common/wallet-config';

import { SignVerifyCard } from './SignVerifyCard';
import { SignVerifyMessageField } from './SignVerifyMessageField';
import { SignVerifySignatureField } from './SignVerifySignatureField';
import { VerifyAddressField } from './VerifyAddressField';
import { type SignVerifyOutcome, type SignVerifyPage } from './types';
import { useSignVerifyCopyValue } from './useSignVerifyCopyValue';
import { type SignVerifyFields, useSignVerifyForm } from './useSignVerifyForm';

export type VerifyMessageParams = {
    address: string;
    message: string;
    signature: string;
    hex: boolean;
};

type VerifyMessageFormProps = {
    symbol: NetworkSymbol;
    onPageChange: (page: SignVerifyPage) => void;
    verifyMessage: (params: VerifyMessageParams) => Promise<VerifyMessageResult>;
};

/** The default Verify form: an address, a message and the signature to check against them. */
export const VerifyMessageForm = ({
    symbol,
    onPageChange,
    verifyMessage,
}: VerifyMessageFormProps) => {
    const [outcome, setOutcome] = useState<SignVerifyOutcome>('idle');

    const {
        register,
        isSubmitting,
        resetForm,
        formSubmit,
        formValues,
        formErrors,
        hexField,
        addressField,
    } = useSignVerifyForm({ isSignPage: false, symbol });

    const { translationString } = useTranslation();
    const copyValue = useSignVerifyCopyValue();

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

    const getErrorMessage = (error?: FieldError) =>
        error ? translationString(error.message as TranslationKey) : undefined;

    const onSubmit = async ({ address, message, signature, hex }: SignVerifyFields) => {
        if (signature === undefined) {
            return;
        }

        const result = await verifyMessage({ address, message, signature, hex });

        // Cancelling on the device leaves the form exactly as it was, the way a cancelled
        // signing does: nothing was verified, and nothing failed to verify either.
        if (result !== 'cancelled') {
            setOutcome(result === 'verified' ? 'verified' : 'failed');
        }
    };

    const clearForm = () => {
        resetForm();
        setOutcome('idle');
    };

    const isCompleted = outcome === 'verified';
    const hasFailedVerification = outcome === 'failed';

    return (
        <SignVerifyCard
            page="verify"
            canVerify
            outcome={outcome}
            onPageChange={onPageChange}
            onSubmit={formSubmit(onSubmit)}
            isSubmitting={isSubmitting}
            onClear={clearForm}
        >
            <VerifyAddressField
                isCompleted={isCompleted}
                address={formValues.address}
                addressField={addressField}
                error={getErrorMessage(formErrors.address)}
                hasError={!!formErrors.address || hasFailedVerification}
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
                isSignPage={false}
                isCompleted={isCompleted}
                hasError={!!formErrors.signature || hasFailedVerification}
                errorMessage={getErrorMessage(formErrors.signature)}
                registration={register('signature')}
                onCopy={copyValue}
            />
        </SignVerifyCard>
    );
};
