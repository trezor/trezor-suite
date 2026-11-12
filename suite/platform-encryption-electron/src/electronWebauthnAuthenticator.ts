import { type DesktopApi, WEBAUTHN_FRAME_ORIGIN } from '@suite/desktop-app-api';
import { type WebauthnAuthenticator } from '@suite-common/platform-encryption';

export type ElectronWebauthnAuthenticatorDeps = {
    desktopApi: DesktopApi;
};

export const createElectronWebauthnAuthenticator = (
    deps: ElectronWebauthnAuthenticatorDeps,
): WebauthnAuthenticator => {
    let frameLoaded: Promise<void> | undefined;

    const ensureFrame = () => {
        frameLoaded ??= new Promise(resolve => {
            const frame = document.createElement('iframe');
            frame.src = `${WEBAUTHN_FRAME_ORIGIN}/`;
            frame.allow = `publickey-credentials-create ${WEBAUTHN_FRAME_ORIGIN}; publickey-credentials-get ${WEBAUTHN_FRAME_ORIGIN}`;
            frame.hidden = true;
            frame.addEventListener('load', () => resolve(), { once: true });
            document.body.appendChild(frame);
        });

        return frameLoaded;
    };

    return {
        createCredential: async () => {
            await ensureFrame();

            return deps.desktopApi.webauthnCreateCredential();
        },

        evaluatePrf: async params => {
            await ensureFrame();

            return deps.desktopApi.webauthnEvaluatePrf(params);
        },
    };
};
