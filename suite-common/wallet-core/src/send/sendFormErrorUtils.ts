import { exhaustive } from '@trezor/type-utils';

import { type SendFormError, type SendFormErrorCause } from './sendFormTypes';

export const getSendFormErrorCause = (sendFormError: SendFormError): SendFormErrorCause => {
    switch (sendFormError.error) {
        case 'fee-levels-compose-failed':
        case 'enhance-transaction-failed':
            return { message: sendFormError.message };
        case 'sign-transaction-failed':
        case 'sign-transaction-timeout':
            return { code: sendFormError.errorCode, message: sendFormError.message };
        case 'push-transaction-failed':
        case 'push-transaction-pending-conflict':
            return {
                code: sendFormError.metadata.error.code,
                message: sendFormError.metadata.error.message,
            };
        default:
            return exhaustive(sendFormError);
    }
};
