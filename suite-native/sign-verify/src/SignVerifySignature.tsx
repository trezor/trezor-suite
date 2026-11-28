import { use } from 'react';

import { Input, InputWrapper } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';
import { throwError } from '@trezor/utils';

import { SignVerifyContext, SignVerifyFormContext } from './SignVerifyContext';
import { SignVerifyCopyButton } from './SignVerifyCopyButton';

export const SignVerifySignature = () => {
    const { page, outcome } = use(SignVerifyContext) ?? throwError('Missing SignVerify');
    const { values, errors, update } =
        use(SignVerifyFormContext) ?? throwError('Missing SignVerify form');

    const { translate } = useTranslate();

    const isSignPage = page === 'sign';
    const isCompleted = outcome === 'signed' || outcome === 'verified';
    const isReadOnly = isSignPage || isCompleted;

    return (
        <InputWrapper label={translate('signAndVerify.signature.label')} error={errors.signature}>
            <Input
                labelType="outsideLabel"
                // Forces a native layout reset of the multiline read-only input after a Clear.
                key={isReadOnly && values.signature === '' ? 'read-only-empty' : null}
                placeholder={
                    isSignPage ? translate('signAndVerify.signature.placeholder') : undefined
                }
                value={values.signature}
                onChangeText={signature => update({ signature })}
                readOnly={isReadOnly}
                hasError={errors.signature !== undefined || outcome === 'failed'}
                rightIcon={isCompleted && <SignVerifyCopyButton value={values.signature} />}
                multiline
            />
        </InputWrapper>
    );
};
