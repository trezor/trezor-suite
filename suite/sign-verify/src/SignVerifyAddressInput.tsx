import { use } from 'react';

import { Translation } from '@suite/intl';
import { Input } from '@trezor/components';
import { throwError } from '@trezor/utils';

import { SignVerifyContext, SignVerifyFormContext } from './SignVerifyContext';
import { SignVerifySubmittedAddress } from './SignVerifySubmittedAddress';

export const SignVerifyAddressInput = () => {
    const { outcome } = use(SignVerifyContext) ?? throwError('Missing SignVerify');
    const { values, errors, update } =
        use(SignVerifyFormContext) ?? throwError('Missing SignVerify form');

    if (outcome === 'verified') {
        return <SignVerifySubmittedAddress address={values.address} />;
    }

    return (
        <Input
            name="address"
            label={<Translation id="TR_ADDRESS" />}
            type="text"
            value={values.address}
            onChange={event => update({ address: event.target.value })}
            hasError={errors.address !== undefined || outcome === 'failed'}
            bottomText={errors.address ? <Translation id={errors.address} /> : null}
            data-testid="@sign-verify/select-address"
        />
    );
};
