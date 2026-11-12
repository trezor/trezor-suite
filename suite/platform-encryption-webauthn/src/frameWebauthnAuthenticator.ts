import {
    EncryptionUnavailable,
    type WebauthnAuthenticator,
} from '@suite-common/platform-encryption';
import { type Result, err, ok } from '@trezor/type-utils';

import {
    WEBAUTHN_FRAME_REQUEST,
    type WebauthnFrameRequest,
    type WebauthnFrameRequestPayload,
    isHex,
    isWebauthnCredential,
    isWebauthnFrameResponse,
} from './webauthnFrameMessages';

export type FrameWebauthnAuthenticatorDeps = {
    loadFrame: () => Promise<void>;
    activateFrame: () => Promise<boolean>;
    postToFrame: (request: WebauthnFrameRequest) => void;
    addMessageListener: (listener: (event: MessageEvent) => void) => () => void;
    isFrameMessage: (event: MessageEvent) => boolean;
};

/**
 * Runs WebAuthn in a frame through postMessage, for documents whose own origin cannot use
 * WebAuthn. The frame has to run `startWebauthnFrameHost`.
 */
export const createFrameWebauthnAuthenticator = (
    deps: FrameWebauthnAuthenticatorDeps,
): WebauthnAuthenticator => {
    let nextRequestId = 0;

    const requestFrame = async (
        payload: WebauthnFrameRequestPayload,
    ): Promise<Result<unknown, EncryptionUnavailable>> => {
        await deps.loadFrame();
        const id = nextRequestId;
        nextRequestId += 1;

        return new Promise(resolve => {
            const removeListener = deps.addMessageListener(event => {
                if (
                    !deps.isFrameMessage(event) ||
                    !isWebauthnFrameResponse(event.data) ||
                    event.data.id !== id
                ) {
                    return;
                }

                removeListener();
                resolve(event.data.result);
            });
            deps.postToFrame({ ...payload, type: WEBAUTHN_FRAME_REQUEST, id });
        });
    };

    return {
        createCredential: async () => {
            await deps.loadFrame();
            // A cross-origin frame may create a credential only right after its own user activation.
            if (!(await deps.activateFrame())) {
                return err(EncryptionUnavailable('The WebAuthn frame could not be activated'));
            }

            const result = await requestFrame({ method: 'createCredential' });
            if (!result.success) {
                return result;
            }

            return isWebauthnCredential(result.payload)
                ? ok(result.payload)
                : err(EncryptionUnavailable('The WebAuthn frame returned an invalid credential'));
        },

        evaluatePrf: async params => {
            const result = await requestFrame({ method: 'evaluatePrf', params });
            if (!result.success) {
                return result;
            }

            return isHex(result.payload)
                ? ok(result.payload)
                : err(EncryptionUnavailable('The WebAuthn frame returned an invalid PRF output'));
        },
    };
};

type CreateIframeWebauthnDepsParams = {
    frameOrigin: string;
    activateFrame: () => Promise<boolean>;
};

export const createIframeWebauthnDeps = ({
    frameOrigin,
    activateFrame,
}: CreateIframeWebauthnDepsParams): FrameWebauthnAuthenticatorDeps => {
    let frame: HTMLIFrameElement | undefined;
    let frameLoaded: Promise<void> | undefined;

    return {
        loadFrame: () => {
            frameLoaded ??= new Promise(resolve => {
                frame = document.createElement('iframe');
                frame.src = `${frameOrigin}/`;
                frame.allow = `publickey-credentials-create ${frameOrigin}; publickey-credentials-get ${frameOrigin}`;
                frame.hidden = true;
                frame.addEventListener('load', () => resolve(), { once: true });
                document.body.appendChild(frame);
            });

            return frameLoaded;
        },
        activateFrame,
        postToFrame: request => frame?.contentWindow?.postMessage(request, frameOrigin),
        addMessageListener: listener => {
            window.addEventListener('message', listener);

            return () => window.removeEventListener('message', listener);
        },
        isFrameMessage: event =>
            event.origin === frameOrigin && event.source === frame?.contentWindow,
    };
};
