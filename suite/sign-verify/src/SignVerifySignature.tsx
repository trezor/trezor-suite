import { use } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { Translation, type TranslationKey, useTranslation } from '@suite/intl';
import { MAX_LENGTH_SIGNATURE } from '@suite-common/sign-verify';
import { Input } from '@trezor/components';
import { throwError } from '@trezor/utils';

import { SignVerifyContext, type SignVerifyValues } from './SignVerifyContext';
import { SignVerifyCopyButton } from './SignVerifyCopyButton';

export const SignVerifySignature = () => {
    const { page, outcome } = use(SignVerifyContext) ?? throwError('Missing SignVerify');
    const {
        register,
        control,
        formState: { errors },
    } = useFormContext<SignVerifyValues>();
    const signature = useWatch({ control, name: 'signature' });

    const { translationString } = useTranslation();

    const { ref, ...signatureField } = register('signature');
    const error = errors.signature?.message as TranslationKey | undefined;
    const isSignPage = page === 'sign';
    const isCompleted = outcome === 'signed' || outcome === 'verified';

    return (
        <Input
            label={translationString('TR_SIGNATURE')}
            maxLength={MAX_LENGTH_SIGNATURE}
            type="text"
            innerRef={ref}
            {...signatureField}
            readOnly={isSignPage || isCompleted}
            isDisabled={isSignPage && signature === ''}
            placeholder={
                isSignPage ? translationString('TR_SIGNATURE_AFTER_SIGNING_PLACEHOLDER') : undefined
            }
            hasError={error !== undefined || outcome === 'failed'}
            bottomText={error ? <Translation id={error} /> : null}
            rightContent={
                isCompleted ? (
                    <SignVerifyCopyButton
                        value={signature}
                        data-testid="@sign-verify/copy-signature"
                    />
                ) : undefined
            }
            data-testid="@sign-verify/signature"
        />
    );
};
