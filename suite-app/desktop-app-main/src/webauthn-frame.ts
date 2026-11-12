import {
    createBrowserWebauthnAuthenticator,
    createNavigatorWebauthnDeps,
    createWindowFrameHostDeps,
    startWebauthnFrameHost,
} from '@suite/platform-encryption-webauthn';

startWebauthnFrameHost({
    ...createWindowFrameHostDeps(),
    webauthnAuthenticator: createBrowserWebauthnAuthenticator(createNavigatorWebauthnDeps()),
});
