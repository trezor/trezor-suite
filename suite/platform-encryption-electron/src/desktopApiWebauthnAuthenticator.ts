import { type DesktopApi } from '@suite/desktop-app-api';
import { type WebauthnAuthenticator } from '@suite-common/platform-encryption';

export type DesktopApiWebauthnAuthenticatorDeps = {
    desktopApi: Pick<DesktopApi, 'webauthnCreateCredential' | 'webauthnEvaluatePrf'>;
};

/** Runs WebAuthn in the main process, which uses the operating system's passkey API. */
export const createDesktopApiWebauthnAuthenticator = (
    deps: DesktopApiWebauthnAuthenticatorDeps,
): WebauthnAuthenticator => ({
    createCredential: () => deps.desktopApi.webauthnCreateCredential(),
    evaluatePrf: params => deps.desktopApi.webauthnEvaluatePrf(params),
});
