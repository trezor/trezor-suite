import { type SuiteSyncUpdateError } from '@suite-common/suite-sync-storage';
import { type EnsureWalletSuiteSyncOnErrors } from '@suite-common/suite-sync-types';
import { type ERRORS } from '@trezor/connect';

import { type ContactNameError } from './contactName';

export type ContactsError =
    | { type: 'NoDevice' }
    | { type: 'PassphraseWallet' }
    | { type: 'InvalidNpub' }
    | { type: 'OwnNpub' }
    | { type: 'DuplicateContact' }
    | { type: 'UnknownContact' }
    | { type: 'InvalidName'; reason: ContactNameError }
    | { type: 'Cancelled' }
    /** Another wallet was selected while the change waited, so the Trezor was not asked. */
    | { type: 'WalletChanged' }
    /** Another host changed the WARD first; the Trezor dropped this change. */
    | { type: 'WardConflict' }
    /** wardd refused or is not reachable; `message` is its own. */
    | { type: 'WardFailed'; message: string }
    | { type: 'DeviceFailed'; message: string }
    | { type: 'SuiteSyncFailed'; error: EnsureWalletSuiteSyncOnErrors | SuiteSyncUpdateError };

const CANCEL_CODES: ERRORS.ErrorCode[] = [
    'Failure_ActionCancelled',
    'Failure_PinCancelled',
    'Method_Cancel',
];

// wardd's own failures reach Suite as messages prefixed by Connect (`wardd <code>: …`) or, when
// wardd cannot be reached, as the WARD client's messages; both name wardd.
const isWarddFailure = (message: string) => /^wardd\b/.test(message);

export const getContactsErrorFromConnect = ({
    message,
    code,
}: ERRORS.SerializedError): ContactsError => {
    if (CANCEL_CODES.includes(code)) {
        return { type: 'Cancelled' };
    }

    if (isWarddFailure(message)) {
        return { type: 'WardFailed', message };
    }

    return { type: 'DeviceFailed', message };
};

export const isWardIdMismatch = (error: ContactsError) =>
    error.type === 'WardFailed' && error.message.startsWith('wardd ward_id_mismatch');
