import { MAX_LENGTH_MESSAGE } from '@suite-common/sign-verify';
import { isHex } from '@trezor/utils';

import { type SignVerifyErrors, type SignVerifyValues } from './SignVerifyContext';

export const getMessageErrors = ({ message, hex }: SignVerifyValues): SignVerifyErrors => {
    if (message === '') {
        return { message: 'forms.errors.mixed.required' };
    }

    if (message.length > MAX_LENGTH_MESSAGE) {
        return { message: 'forms.errors.string.max' };
    }

    if (hex && !isHex(message, { prefix: 'optional', allowEmpty: false })) {
        return { message: 'signAndVerify.hex.invalid' };
    }

    return {};
};
