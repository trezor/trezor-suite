import { type WebauthnAuthenticatorDep } from '@suite-common/platform-encryption';

import {
    WEBAUTHN_FRAME_RESPONSE,
    type WebauthnFrameRequest,
    type WebauthnFrameResponse,
    isWebauthnFrameRequest,
} from './webauthnFrameMessages';

export type WebauthnFrameHostDeps = WebauthnAuthenticatorDep & {
    addMessageListener: (listener: (event: MessageEvent) => void) => () => void;
    isParentMessage: (event: MessageEvent) => boolean;
    postToParent: (response: WebauthnFrameResponse) => void;
};

/**
 * Runs inside the frame: answers WebAuthn requests posted by the parent document.
 * Returns a function that stops listening.
 */
export const startWebauthnFrameHost = (deps: WebauthnFrameHostDeps): (() => void) => {
    const handleRequest = async (request: WebauthnFrameRequest) => {
        const result =
            request.method === 'createCredential'
                ? await deps.webauthnAuthenticator.createCredential()
                : await deps.webauthnAuthenticator.evaluatePrf(request.params);

        deps.postToParent({ type: WEBAUTHN_FRAME_RESPONSE, id: request.id, result });
    };

    return deps.addMessageListener(event => {
        if (!deps.isParentMessage(event) || !isWebauthnFrameRequest(event.data)) {
            return;
        }

        handleRequest(event.data);
    });
};

export const createWindowFrameHostDeps = (): Omit<
    WebauthnFrameHostDeps,
    'webauthnAuthenticator'
> => ({
    addMessageListener: listener => {
        window.addEventListener('message', listener);

        return () => window.removeEventListener('message', listener);
    },
    isParentMessage: event => event.source === window.parent,
    // The parent document is loaded from file:, whose opaque origin cannot be targeted.
    postToParent: response => window.parent.postMessage(response, '*'),
});
