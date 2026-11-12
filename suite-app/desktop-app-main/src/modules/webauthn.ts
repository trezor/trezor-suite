import { app, net, session } from 'electron';

import { WEBAUTHN_FRAME_ORIGIN, webauthnEvaluatePrfParams } from '@suite/desktop-app-api';
import { EncryptionUnavailable, type WebauthnCredential } from '@suite-common/platform-encryption';
import { isMacOs } from '@trezor/env-utils';
import { type Result, err, ok } from '@trezor/type-utils';

import { webauthnKeychainAccessGroup } from '../config';
import type { ModuleInit } from './module';
import { ipcMain } from '../ipcMain';

export const SERVICE_NAME = 'webauthn';

const FRAME_DOCUMENT = '<!doctype html><title>Trezor Suite WebAuthn</title>';

const FRAME_SCRIPT_HELPERS = `
    const toHex = buffer =>
        Array.from(new Uint8Array(buffer), byte => byte.toString(16).padStart(2, '0')).join('');
    const fromHex = hex => Uint8Array.from(hex.match(/../g), pair => parseInt(pair, 16));
    const describeError = error => error.name + ': ' + error.message;
`;

const CREATE_CREDENTIAL_SCRIPT = `(async () => {
    ${FRAME_SCRIPT_HELPERS}
    try {
        const credential = await navigator.credentials.create({
            signal: AbortSignal.timeout(60000),
            publicKey: {
                rp: { id: location.hostname, name: 'Trezor Suite' },
                user: {
                    id: crypto.getRandomValues(new Uint8Array(16)),
                    name: 'Trezor Suite',
                    displayName: 'Trezor Suite',
                },
                challenge: crypto.getRandomValues(new Uint8Array(32)),
                pubKeyCredParams: [
                    { type: 'public-key', alg: -7 },
                    { type: 'public-key', alg: -257 },
                ],
                authenticatorSelection: { residentKey: 'discouraged', userVerification: 'discouraged' },
                attestation: 'none',
                extensions: { prf: {} },
            },
        });

        return {
            success: true,
            payload: {
                credentialIdHex: toHex(credential.rawId),
                isPrfEnabled: credential.getClientExtensionResults().prf?.enabled === true,
            },
        };
    } catch (error) {
        return { success: false, message: 'Credential creation failed: ' + describeError(error) };
    }
})()`;

const createEvaluatePrfScript = (params: unknown) => `(async ({ credentialIdHex, saltHex }) => {
    ${FRAME_SCRIPT_HELPERS}
    try {
        const assertion = await navigator.credentials.get({
            signal: AbortSignal.timeout(60000),
            publicKey: {
                rpId: location.hostname,
                challenge: crypto.getRandomValues(new Uint8Array(32)),
                allowCredentials: [{ type: 'public-key', id: fromHex(credentialIdHex) }],
                userVerification: 'discouraged',
                extensions: { prf: { eval: { first: fromHex(saltHex) } } },
            },
        });
        const prfOutput = assertion.getClientExtensionResults().prf?.results?.first;
        if (!prfOutput) {
            return { success: false, message: 'The assertion carries no PRF output' };
        }

        return { success: true, payload: toHex(prfOutput) };
    } catch (error) {
        return { success: false, message: 'Assertion failed: ' + describeError(error) };
    }
})(${JSON.stringify(params)})`;

type FrameResult = { success: true; payload: unknown } | { success: false; message: string };

const isFrameResult = (value: unknown): value is FrameResult =>
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    (value.success === true || ('message' in value && typeof value.message === 'string'));

const isHex = (value: string) => /^(?:[0-9a-f]{2})+$/.test(value);

const isWebauthnCredential = (value: unknown): value is WebauthnCredential =>
    typeof value === 'object' &&
    value !== null &&
    'credentialIdHex' in value &&
    typeof value.credentialIdHex === 'string' &&
    isHex(value.credentialIdHex) &&
    'isPrfEnabled' in value &&
    typeof value.isPrfEnabled === 'boolean';

export const init: ModuleInit = ({ mainWindowProxy, logger }) => {
    if (isMacOs()) {
        app.configureWebAuthn({
            touchID: {
                keychainAccessGroup: webauthnKeychainAccessGroup,
                promptReason: 'verify your identity on $1',
            },
        });
    }

    // Answering here keeps the frame origin off the network: no port is opened, so no other
    // process can serve or read it. Every other http request continues to the network.
    session.defaultSession.protocol.handle('http', request => {
        const url = new URL(request.url);
        if (url.origin !== WEBAUTHN_FRAME_ORIGIN) {
            return net.fetch(request, { bypassCustomProtocolHandlers: true });
        }

        if (url.pathname !== '/') {
            return new Response(null, { status: 404 });
        }

        return new Response(FRAME_DOCUMENT, {
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Content-Security-Policy': "default-src 'none'",
                'Cache-Control': 'no-store',
            },
        });
    });

    const runInFrame = async (script: string): Promise<Result<unknown, EncryptionUnavailable>> => {
        const mainFrame = mainWindowProxy.getInstance()?.webContents.mainFrame;
        const frame = mainFrame?.frames.find(child => child.origin === WEBAUTHN_FRAME_ORIGIN);
        if (frame === undefined) {
            return err(EncryptionUnavailable('The WebAuthn frame is not loaded'));
        }

        // A credential can be created in a cross-origin frame only with a user activation in that
        // frame, and the click happened in the parent document.
        const result: unknown = await frame.executeJavaScript(script, true);
        if (!isFrameResult(result)) {
            logger.error(SERVICE_NAME, 'The WebAuthn frame returned an unexpected result');

            return err(EncryptionUnavailable('The WebAuthn frame returned an unexpected result'));
        }

        return result.success ? ok(result.payload) : err(EncryptionUnavailable(result.message));
    };

    ipcMain.handle('webauthn/create-credential', async () => {
        const result = await runInFrame(CREATE_CREDENTIAL_SCRIPT);
        if (!result.success) {
            return result;
        }

        const { payload } = result;
        if (!isWebauthnCredential(payload)) {
            return err(EncryptionUnavailable('The WebAuthn frame returned an invalid credential'));
        }

        return ok({
            credentialIdHex: payload.credentialIdHex,
            isPrfEnabled: payload.isPrfEnabled,
        });
    });

    ipcMain.handle('webauthn/evaluate-prf', async (_, params) => {
        const parsedParams = webauthnEvaluatePrfParams.safeParse(params);
        if (!parsedParams.success) {
            return err(EncryptionUnavailable('Invalid WebAuthn PRF parameters'));
        }

        const result = await runInFrame(createEvaluatePrfScript(parsedParams.data));
        if (!result.success) {
            return result;
        }

        const { payload } = result;
        if (typeof payload !== 'string' || !isHex(payload)) {
            return err(EncryptionUnavailable('The WebAuthn frame returned an invalid PRF output'));
        }

        return ok(payload);
    });
};
