import { type Result } from '@trezor/type-utils';

import { type EncryptionUnavailable } from './platformEncryption';

export type WebauthnCredential = {
    credentialIdHex: string;
    isPrfEnabled: boolean;
};

export type EvaluateWebauthnPrfParams = {
    credentialIdHex: string;
    saltHex: string;
};

/** @serviceContract */
export type WebauthnAuthenticator = {
    createCredential: () => Promise<Result<WebauthnCredential, EncryptionUnavailable>>;

    evaluatePrf: (
        params: EvaluateWebauthnPrfParams,
    ) => Promise<Result<string, EncryptionUnavailable>>;
};

export type WebauthnAuthenticatorDep = { webauthnAuthenticator: WebauthnAuthenticator };

export const injectWebauthnAuthenticator = (services: any): WebauthnAuthenticatorDep => ({
    webauthnAuthenticator: services.webauthnAuthenticator,
});
