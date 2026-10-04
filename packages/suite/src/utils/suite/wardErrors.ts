import { type TranslationKey } from '@suite/intl';
import { isCanceledErrorMessage } from '@suite-common/device';
import { type ERRORS, PROTO } from '@trezor/connect';

/**
 * Why a WARD operation did not complete. The wardd codes are those of the relay contract
 * (`packages/ward-core/relay.md`); the others come from Suite and Connect.
 */
export type WardErrorCode =
    | 'missing_token'
    | 'no_device'
    | 'wallet_changed'
    | 'cancelled'
    | 'unreachable'
    | 'unauthorised'
    | 'version_mismatch'
    | 'no_store'
    | 'device_failure'
    | 'wm_conflict'
    | 'wm_behind'
    | 'needs_rejoin'
    | 'internal';

export type WardError = {
    code: WardErrorCode;
    /** Technical wording from Connect, wardd or Suite. Show it locally, never log or report it. */
    detail?: string;
};

// `wardRelay` keeps wardd's code in the message, as in `wardd needs_rejoin: ...`. `unreachable`
// and `closed` are the client's own codes for a socket that never opened or went away.
const WARDD_ERROR_PATTERN = /^wardd ([a-z_]+): /;

const CANCELLED_CONNECT_CODES: ERRORS.ErrorCode[] = [
    'Failure_ActionCancelled',
    'Failure_PinCancelled',
    'Method_Cancel',
];
const NO_DEVICE_CONNECT_CODES: ERRORS.ErrorCode[] = ['Device_NotFound', 'Device_Disconnected'];

// Only a Failure the firmware sent is the device's fault. Connect's own codes share the prefix:
// any plain Error thrown inside Connect, such as a missing WebSocket implementation, arrives as
// `Failure_UnknownCode`.
const isDeviceFailureCode = (code: ERRORS.ErrorCode): boolean =>
    Object.hasOwn(PROTO.Enum_FailureType, code);

const getWarddErrorCode = (warddCode: string): WardErrorCode => {
    switch (warddCode) {
        case 'unreachable':
        case 'closed':
            return 'unreachable';
        case 'unauthorised':
        case 'version_mismatch':
        case 'no_store':
        case 'device_failure':
        case 'wm_conflict':
        case 'wm_behind':
        case 'needs_rejoin':
            return warddCode;
        // `bad_request`, `internal` and any code a newer wardd adds leave the user nothing to do.
        default:
            return 'internal';
    }
};

export const getWardErrorFromConnect = ({ message, code }: ERRORS.SerializedError): WardError => {
    const warddCode = WARDD_ERROR_PATTERN.exec(message)?.[1];

    if (warddCode !== undefined) {
        return { code: getWarddErrorCode(warddCode), detail: message };
    }

    // Matches what the delegated identity key retrieval treats as a cancel, so a cancel reads the
    // same whichever device call of a WARD action it interrupts.
    if (CANCELLED_CONNECT_CODES.includes(code) || isCanceledErrorMessage(message)) {
        return { code: 'cancelled', detail: message };
    }

    if (NO_DEVICE_CONNECT_CODES.includes(code)) {
        return { code: 'no_device', detail: message };
    }

    if (isDeviceFailureCode(code)) {
        return { code: 'device_failure', detail: message };
    }

    return { code: 'internal', detail: message };
};

const WARD_ERROR_TRANSLATION_KEYS: Record<WardErrorCode, TranslationKey> = {
    missing_token: 'TR_WARD_ERROR_MISSING_TOKEN',
    no_device: 'TR_WARD_ERROR_NO_DEVICE',
    wallet_changed: 'TR_WARD_ERROR_WALLET_CHANGED',
    cancelled: 'TR_WARD_ERROR_CANCELLED',
    unreachable: 'TR_WARD_ERROR_UNREACHABLE',
    unauthorised: 'TR_WARD_ERROR_UNAUTHORISED',
    version_mismatch: 'TR_WARD_ERROR_VERSION_MISMATCH',
    no_store: 'TR_WARD_ERROR_NO_STORE',
    device_failure: 'TR_WARD_ERROR_DEVICE_FAILURE',
    wm_conflict: 'TR_WARD_ERROR_WM_CONFLICT',
    wm_behind: 'TR_WARD_ERROR_WM_BEHIND',
    needs_rejoin: 'TR_WARD_ERROR_NEEDS_REJOIN',
    internal: 'TR_WARD_ERROR_INTERNAL',
};

export const getWardErrorTranslationKey = (code: WardErrorCode): TranslationKey =>
    WARD_ERROR_TRANSLATION_KEYS[code];
