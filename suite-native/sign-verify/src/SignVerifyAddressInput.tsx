import { use } from 'react';

import { Input, InputWrapper } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';
import { throwError } from '@trezor/utils';

import { SignVerifyContext, SignVerifyFormContext } from './SignVerifyContext';
import { SignVerifyCopyButton } from './SignVerifyCopyButton';

export const SignVerifyAddressInput = () => {
    const { outcome } = use(SignVerifyContext) ?? throwError('Missing SignVerify');
    const { values, errors, update } =
        use(SignVerifyFormContext) ?? throwError('Missing SignVerify form');

    const { translate } = useTranslate();

    const isVerified = outcome === 'verified';

    return (
        <InputWrapper label={translate('signAndVerify.address.label')} error={errors.address}>
            <Input
                labelType="outsideLabel"
                value={values.address}
                onChangeText={address => update({ address })}
                readOnly={isVerified}
                hasError={errors.address !== undefined || outcome === 'failed'}
                rightIcon={isVerified && <SignVerifyCopyButton value={values.address} />}
            />
        </InputWrapper>
    );
};
