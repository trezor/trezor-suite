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

// The typed Connect error the WARD mapping takes, so its code lists are checked by the compiler.
type ConnectError = Parameters<typeof getWardErrorFromConnect>[0];

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
export const getContactsErrorFromConnect = (error: ConnectError): ContactsError =>
    isFirmwareUnsupportedError(error)
        ? { code: 'firmware_unsupported', detail: error.message }
        : getWardErrorFromConnect(error);
