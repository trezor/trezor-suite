import { use } from 'react';

import { Translation, useTranslation } from '@suite/intl';
import { MAX_LENGTH_SIGNATURE } from '@suite-common/sign-verify';
import { Input } from '@trezor/components';
import { throwError } from '@trezor/utils';

import { SignVerifyContext, SignVerifyFormContext } from './SignVerifyContext';
import { SignVerifyCopyButton } from './SignVerifyCopyButton';

export const SignVerifySignature = () => {
    const { page, outcome } = use(SignVerifyContext) ?? throwError('Missing SignVerify');
    const { values, errors, update } =
        use(SignVerifyFormContext) ?? throwError('Missing SignVerify form');

    const { translationString } = useTranslation();

    const isSignPage = page === 'sign';
    const isCompleted = outcome === 'signed' || outcome === 'verified';

    return (
        <Input
            label={translationString('TR_SIGNATURE')}
            maxLength={MAX_LENGTH_SIGNATURE}
            type="text"
            value={values.signature}
            onChange={event => update({ signature: event.target.value })}
            readOnly={isSignPage || isCompleted}
            isDisabled={isSignPage && values.signature === ''}
            placeholder={
                isSignPage ? translationString('TR_SIGNATURE_AFTER_SIGNING_PLACEHOLDER') : undefined
            }
            hasError={errors.signature !== undefined || outcome === 'failed'}
            bottomText={errors.signature ? <Translation id={errors.signature} /> : null}
            rightContent={
                isCompleted ? (
                    <SignVerifyCopyButton
                        value={values.signature}
                        data-testid="@sign-verify/copy-signature"
                    />
                ) : undefined
            }
            data-testid="@sign-verify/signature"
        />
    );
};
