import { use } from 'react';
import { useWatch } from 'react-hook-form';

import { useTranslation } from '@suite/intl';
import { Input } from '@trezor/components';
import { throwError } from '@trezor/utils';

import { SignVerifyContext, type SignVerifyValues } from './SignVerifyContext';
import { SignVerifyCopyButton } from './SignVerifyCopyButton';

export const SignVerifyPublicKey = () => {
    const { outcome } = use(SignVerifyContext) ?? throwError('Missing SignVerify');
    const pubKey = useWatch<SignVerifyValues, 'pubKey'>({ name: 'pubKey' });

    const { translationString } = useTranslation();

    return (
        <Input
            label={translationString('TR_PUBLIC_KEY')}
            type="text"
            readOnly
            isDisabled={pubKey === ''}
            placeholder={translationString('TR_SIGNATURE_AFTER_SIGNING_PLACEHOLDER')}
            value={pubKey}
            rightContent={
                outcome === 'signed' ? (
                    <SignVerifyCopyButton value={pubKey} data-testid="@sign-verify/copy-pubkey" />
                ) : undefined
            }
            data-testid="@sign-verify/pubKey"
        />
    );
};
