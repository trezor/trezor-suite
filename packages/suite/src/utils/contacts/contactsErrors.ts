import { type TranslationKey } from '@suite/intl';
import { type ERRORS } from '@trezor/connect';

import { type WardErrorCode, getWardErrorFromConnect } from 'src/utils/suite/wardErrors';

/**
 * Why a contacts action did not complete. Writing a contact's name to WARD fails with a WARD code;
 * the other codes come from the contacts flows themselves.
 */
export type ContactsErrorCode =
    | WardErrorCode
    | 'firmware_unsupported'
    | 'invalid_identity'
    | 'invalid_label'
    | 'own_identity'
    | 'duplicate_contact'
    | 'unknown_contact'
    | 'missing_identity'
    | 'unsupported_account'
    | 'no_fresh_address'
    | 'address_mismatch'
    | 'invalid_attestation';

export type ContactsError = {
    code: ContactsErrorCode;
    /** Technical wording from Connect or wardd. Show it locally, never log or report it. */
    detail?: string;
};

/**
 * Whether a Nostr Connect call failed because the firmware cannot do Nostr. The message is an
 * internal string in both cases, so the stable Connect code decides:
 * - `Device_FwException`: Connect refused the method for this firmware. Nostr is allowed only on
 *   debug builds, and production firmware gets `ui-device_firmware_unsupported`.
 * - `Failure_UnexpectedMessage`: the request reached firmware that has no handler for it.
 *
 * The message test is only a fallback for an error that arrives without a code.
 */
export const isFirmwareUnsupportedError = (error?: {
    code?: string;
    message?: string;
}): boolean => {
    if (!error) return false;

    if (error.code === 'Device_FwException' || error.code === 'Failure_UnexpectedMessage') {
        return true;
    }

    return /unsupported|not supported|unexpected message|invalid package/i.test(
        error.message ?? '',
    );
};

/**
 * Maps a failed Nostr Connect call. Anything other than missing Nostr support is classified like
 * a WARD device call: cancelled, no device, a failure the device sent, or else internal.
 */
export const getContactsErrorFromConnect = (error: ERRORS.SerializedError): ContactsError =>
    isFirmwareUnsupportedError(error)
        ? { code: 'firmware_unsupported', detail: error.message }
        : getWardErrorFromConnect(error);

// Loading the identity, signing an address and writing to WARD all fail with the device and Connect
// codes, so those get wording that does not name WARD. The wardd codes come only from WARD writes.
const CONTACTS_ERROR_TRANSLATION_KEYS: Record<ContactsErrorCode, TranslationKey> = {
    missing_token: 'TR_WARD_ERROR_MISSING_TOKEN',
    no_device: 'TR_WARD_ERROR_NO_DEVICE',
    wallet_changed: 'TR_CONTACTS_ERROR_WALLET_CHANGED',
    cancelled: 'TR_CONTACTS_ERROR_CANCELLED',
    unreachable: 'TR_WARD_ERROR_UNREACHABLE',
    unauthorised: 'TR_WARD_ERROR_UNAUTHORISED',
    version_mismatch: 'TR_WARD_ERROR_VERSION_MISMATCH',
    no_store: 'TR_WARD_ERROR_NO_STORE',
    device_failure: 'TR_CONTACTS_ERROR_DEVICE_FAILURE',
    wm_conflict: 'TR_WARD_ERROR_WM_CONFLICT',
    wm_behind: 'TR_WARD_ERROR_WM_BEHIND',
    needs_rejoin: 'TR_WARD_ERROR_NEEDS_REJOIN',
    internal: 'TR_CONTACTS_ERROR_INTERNAL',
    firmware_unsupported: 'TR_CONTACTS_ERROR_FIRMWARE_UNSUPPORTED',
    invalid_identity: 'TR_CONTACTS_INVALID_IDENTITY',
    invalid_label: 'TR_CONTACTS_ERROR_INVALID_LABEL',
    own_identity: 'TR_CONTACTS_IDENTITY_IS_SELF',
    duplicate_contact: 'TR_CONTACTS_IDENTITY_DUPLICATE',
    unknown_contact: 'TR_CONTACTS_ERROR_UNKNOWN_CONTACT',
    missing_identity: 'TR_CONTACTS_ERROR_MISSING_IDENTITY',
    unsupported_account: 'TR_CONTACTS_ERROR_UNSUPPORTED_ACCOUNT',
    no_fresh_address: 'TR_CONTACTS_ERROR_NO_FRESH_ADDRESS',
    address_mismatch: 'TR_CONTACTS_ERROR_ADDRESS_MISMATCH',
    invalid_attestation: 'TR_CONTACTS_ERROR_INVALID_ATTESTATION',
};

export const getContactsErrorTranslationKey = (code: ContactsErrorCode): TranslationKey =>
    CONTACTS_ERROR_TRANSLATION_KEYS[code];
