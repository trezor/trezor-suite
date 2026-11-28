import { use } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { Translation, type TranslationKey } from '@suite/intl';
import { Input } from '@trezor/components';
import { throwError } from '@trezor/utils';

import { SignVerifyContext, type SignVerifyValues } from './SignVerifyContext';
import { SignVerifySubmittedAddress } from './SignVerifySubmittedAddress';

export const SignVerifyAddressInput = () => {
    const { outcome } = use(SignVerifyContext) ?? throwError('Missing SignVerify');
    const {
        register,
        control,
        formState: { errors },
    } = useFormContext<SignVerifyValues>();
    const address = useWatch({ control, name: 'address' });

    if (outcome === 'verified') {
        return <SignVerifySubmittedAddress address={address} />;
    }

    const { ref, ...addressField } = register('address');
    const error = errors.address?.message as TranslationKey | undefined;

    return (
        <Input
            label={<Translation id="TR_ADDRESS" />}
            type="text"
            innerRef={ref}
            {...addressField}
            hasError={error !== undefined || outcome === 'failed'}
            bottomText={error ? <Translation id={error} /> : null}
            data-testid="@sign-verify/select-address"
        />
    );
};
