import { type SerializedError } from '@trezor/connect-common/src/constants/errors';
import { type Err } from '@trezor/type-utils';

import { type PushTransactionError } from './sendFormTypes';

const PENDING_CONFLICT_MESSAGE = 'could not replace existing tx';

export const getPushTransactionError = (response: Err<SerializedError>): PushTransactionError => ({
    error: response.error.message.includes(PENDING_CONFLICT_MESSAGE)
        ? 'push-transaction-pending-conflict'
        : 'push-transaction-failed',
    metadata: response,
});
