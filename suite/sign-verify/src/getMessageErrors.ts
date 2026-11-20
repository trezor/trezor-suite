import { MAX_LENGTH_MESSAGE } from '@suite-common/sign-verify';
import { isHex } from '@trezor/utils';

import { type SignVerifyErrors, type SignVerifyValues } from './SignVerifyContext';

export const getMessageErrors = ({ message, hex }: SignVerifyValues): SignVerifyErrors => {
    if (message === '') {
        return { message: 'TR_REQUIRED_FIELD' };
    }

    if (message.length > MAX_LENGTH_MESSAGE) {
        return { message: 'TR_TOO_LONG' };
    }

    if (hex && !isHex(message, { prefix: 'optional', allowEmpty: false })) {
        return { message: 'DATA_NOT_VALID_HEX' };
    }

    return {};
};
