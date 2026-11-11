import { type ReactNode, useState } from 'react';
import { type FieldError } from 'react-hook-form';

import { type TranslationKey, useTranslation } from '@suite/intl';
import { type SignedMessage } from '@suite-common/sign-verify';
import { type NetworkSymbol } from '@suite-common/wallet-config';

import { SignAddressField } from './SignAddressField';
import { SignVerifyCard } from './SignVerifyCard';
import { SignVerifyMessageField } from './SignVerifyMessageField';
import { SignVerifySignatureField } from './SignVerifySignatureField';
import { SignedMessageContext } from './SignedMessageContext';
import { type SignAddress, type SignVerifyPage } from './types';
import { useSignVerifyCopyValue } from './useSignVerifyCopyValue';
import { type SignVerifyFields, useSignVerifyForm } from './useSignVerifyForm';

export type SignMessageParams = {
    path: string;
    address: string;
    message: string;
    hex: boolean;
};

type SignMessageFormProps = {
    symbol: NetworkSymbol;
    addresses: SignAddress[];
    /** A network with a single address signs with it and does not let the user pick another. */
    isAddressSelectable: boolean;
    defaultAddress?: { path: string; address: string };
    canVerify: boolean;
    onPageChange?: (page: SignVerifyPage) => void;
    /** The network's own signing options, shown above the address. */
    signingOptions?: ReactNode;
    /** The network's own outputs of the signing, shown below the signature. */
    signedMessageFields?: ReactNode;
    signMessage: (params: SignMessageParams) => Promise<SignedMessage | false>;
    onClear?: () => void;
};

/**
 * The default Sign form: an address, a message and the resulting signature. A network adds its
 * own options and outputs; they follow the signing through `useSignedMessage`.
 */
export const SignMessageForm = ({
    symbol,
    addresses,
    isAddressSelectable,
    defaultAddress,
    canVerify,
    onPageChange,
    signingOptions,
    signedMessageFields,
    signMessage,
    onClear,
}: SignMessageFormProps) => {
    const [signedMessage, setSignedMessage] = useState<SignedMessage>();

    const {
        register,
        isSubmitting,
        resetForm,
        formSubmit,
        formValues,
        formErrors,
        formSetSignature,
        hexField,
        pathField,
    } = useSignVerifyForm({ isSignPage: true, symbol, defaultAddress });

    const { translationString } = useTranslation();
    const copyValue = useSignVerifyCopyValue();

    const getErrorMessage = (error?: FieldError) =>
        error ? translationString(error.message as TranslationKey) : undefined;

    const onSubmit = async ({ path, address, message, hex }: SignVerifyFields) => {
        if (path === undefined) {
            return;
        }

        const result = await signMessage({ path, address, message, hex });

        if (result) {
            formSetSignature(result.signature);
            setSignedMessage(result);
        }
    };

    const clearForm = () => {
        resetForm();
        setSignedMessage(undefined);
        onClear?.();
    };

    const isCompleted = signedMessage !== undefined;

    return (
        <SignedMessageContext value={{ signedMessage }}>
            <SignVerifyCard
                page="sign"
                canVerify={canVerify}
                outcome={isCompleted ? 'signed' : 'idle'}
                onPageChange={onPageChange}
                onSubmit={formSubmit(onSubmit)}
                isSubmitting={isSubmitting}
                onClear={clearForm}
            >
                {signingOptions}
                <SignAddressField
                    addresses={addresses}
                    isAddressSelectable={isAddressSelectable}
                    isCompleted={isCompleted}
                    address={formValues.address}
                    pathField={pathField}
                    error={getErrorMessage(formErrors.path)}
                    hasError={!!formErrors.path}
                    onCopy={copyValue}
                />
                <SignVerifyMessageField
                    message={formValues.message}
                    isCompleted={isCompleted}
                    hasError={!!formErrors.message}
                    errorMessage={getErrorMessage(formErrors.message)}
                    hexField={hexField}
                    registration={register('message')}
                    onCopy={copyValue}
                />
                <SignVerifySignatureField
                    signature={formValues.signature}
                    isSignPage
                    isCompleted={isCompleted}
                    hasError={!!formErrors.signature}
                    errorMessage={getErrorMessage(formErrors.signature)}
                    registration={register('signature')}
                    onCopy={copyValue}
                />
                {signedMessageFields}
            </SignVerifyCard>
        </SignedMessageContext>
    );
};
