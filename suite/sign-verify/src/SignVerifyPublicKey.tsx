import { use } from 'react';

import { useTranslation } from '@suite/intl';
import { Input } from '@trezor/components';
import { throwError } from '@trezor/utils';

import { SignVerifyFormContext } from './SignVerifyContext';
import { SignVerifyCopyButton } from './SignVerifyCopyButton';

export const SignVerifyPublicKey = () => {
    const { values } = use(SignVerifyFormContext) ?? throwError('Missing SignVerify form');

    const { translationString } = useTranslation();

    if (values.pubKey === '') {
        return null;
    }

    return (
        <Input
            label={translationString('TR_PUBLIC_KEY')}
            type="text"
            readOnly
            value={values.pubKey}
            rightContent={
                <SignVerifyCopyButton
                    value={values.pubKey}
                    data-testid="@sign-verify/copy-pubkey"
                />
            }
            data-testid="@sign-verify/pubKey"
        />
    );
};
