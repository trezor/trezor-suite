import {
    type EncryptionUnavailable,
    type EvaluateWebauthnPrfParams,
    type WebauthnCredential,
} from '@suite-common/platform-encryption';
import { type Result } from '@trezor/type-utils';

export const WEBAUTHN_FRAME_REQUEST = 'trezor-suite/webauthn-frame-request';
export const WEBAUTHN_FRAME_RESPONSE = 'trezor-suite/webauthn-frame-response';

export type WebauthnFrameRequestPayload =
    { method: 'createCredential' } | { method: 'evaluatePrf'; params: EvaluateWebauthnPrfParams };

export type WebauthnFrameRequest = WebauthnFrameRequestPayload & {
    type: typeof WEBAUTHN_FRAME_REQUEST;
    id: number;
};

export type WebauthnFrameResponse = {
    type: typeof WEBAUTHN_FRAME_RESPONSE;
    id: number;
    result: Result<unknown, EncryptionUnavailable>;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

export const isHex = (value: unknown): value is string =>
    typeof value === 'string' && /^(?:[0-9a-fA-F]{2})+$/.test(value);

export const isWebauthnCredential = (value: unknown): value is WebauthnCredential =>
    isRecord(value) && isHex(value.credentialIdHex) && typeof value.isPrfEnabled === 'boolean';

export const isWebauthnFrameRequest = (value: unknown): value is WebauthnFrameRequest => {
    if (!isRecord(value) || value.type !== WEBAUTHN_FRAME_REQUEST) {
        return false;
    }

    if (typeof value.id !== 'number') {
        return false;
    }

    if (value.method === 'createCredential') {
        return true;
    }

    return (
        value.method === 'evaluatePrf' &&
        isRecord(value.params) &&
        isHex(value.params.credentialIdHex) &&
        isHex(value.params.saltHex)
    );
};

export const isWebauthnFrameResponse = (value: unknown): value is WebauthnFrameResponse =>
    isRecord(value) &&
    value.type === WEBAUTHN_FRAME_RESPONSE &&
    typeof value.id === 'number' &&
    isRecord(value.result) &&
    typeof value.result.success === 'boolean';
