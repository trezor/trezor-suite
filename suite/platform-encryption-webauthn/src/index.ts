export {
    createLocalStorageCredentialIdStorage,
    createWebauthnPlatformEncryption,
    type WebauthnCredentialIdStorage,
    type WebauthnPlatformEncryptionDeps,
} from './webauthnPlatformEncryption';
export {
    createBrowserWebauthnAuthenticator,
    createNavigatorWebauthnDeps,
    type BrowserWebauthnAuthenticatorDeps,
} from './browserWebauthnAuthenticator';
export {
    createFrameWebauthnAuthenticator,
    createIframeWebauthnDeps,
    type FrameWebauthnAuthenticatorDeps,
} from './frameWebauthnAuthenticator';
export {
    createWindowFrameHostDeps,
    startWebauthnFrameHost,
    type WebauthnFrameHostDeps,
} from './webauthnFrameHost';
