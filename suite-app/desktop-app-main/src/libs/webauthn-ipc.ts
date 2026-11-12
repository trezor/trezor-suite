import { isHex } from '@suite/platform-encryption-webauthn';
import {
    EncryptionUnavailable,
    type WebauthnAuthenticator,
} from '@suite-common/platform-encryption';
import { err } from '@trezor/type-utils';

export type EvaluatePrfFromIpcDeps = {
    webauthnAuthenticator: WebauthnAuthenticator;
};

export type EvaluatePrfFromIpc = (
    params: unknown,
) => ReturnType<WebauthnAuthenticator['evaluatePrf']>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

/** IPC parameters come from the renderer, so they are checked before they reach the passkey. */
export const createEvaluatePrfFromIpc =
    (deps: EvaluatePrfFromIpcDeps): EvaluatePrfFromIpc =>
    params => {
        if (!isRecord(params) || !isHex(params.credentialIdHex) || !isHex(params.saltHex)) {
            return Promise.resolve(err(EncryptionUnavailable('Invalid WebAuthn PRF parameters')));
        }

        return deps.webauthnAuthenticator.evaluatePrf({
            credentialIdHex: params.credentialIdHex,
            saltHex: params.saltHex,
        });
    };
