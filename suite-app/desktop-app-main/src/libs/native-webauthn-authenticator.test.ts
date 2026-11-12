import { EncryptionUnavailable } from '@suite-common/platform-encryption';
import { createMockDeps } from '@trezor/dependency-injection';
import { err, ok } from '@trezor/type-utils';

import {
    type NativeWebauthnAuthenticatorDeps,
    createNativeWebauthnAuthenticator,
} from './native-webauthn-authenticator';

const WINDOW_HANDLE = Buffer.from([1]);
const CREDENTIAL_ID_BASE64URL = Buffer.from([0xab, 0xcd]).toString('base64url');
const PRF_OUTPUT_BASE64URL = Buffer.from([0x01, 0x02]).toString('base64url');

const createDeps = () =>
    createMockDeps<NativeWebauthnAuthenticatorDeps>({
        relyingPartyId: 'trezor.io',
        getNativeWindowHandle: () => WINDOW_HANDLE,
        createCredential: () =>
            Promise.resolve({
                success: true,
                data: {
                    credentialId: CREDENTIAL_ID_BASE64URL,
                    clientDataJSON: '',
                    attestationObject: '',
                    authData: '',
                    publicKey: '',
                    publicKeyAlgorithm: -7,
                    transports: ['internal'],
                    authenticatorAttachment: 'platform',
                    extensions: {},
                },
            }),
        getCredential: () =>
            Promise.resolve({
                success: true,
                data: {
                    credentialId: CREDENTIAL_ID_BASE64URL,
                    clientDataJSON: '',
                    authenticatorData: '',
                    signature: '',
                    userHandle: null,
                    authenticatorAttachment: 'platform',
                    extensions: { prf: { results: { first: PRF_OUTPUT_BASE64URL } } },
                },
            }),
        getRandomBytes: length => new Uint8Array(length),
    });

describe(createNativeWebauthnAuthenticator.name, () => {
    it('creates a credential for the relying party in the app window', async () => {
        const deps = createDeps();

        const result = await createNativeWebauthnAuthenticator(deps).createCredential();

        expect(result).toEqual(ok({ credentialIdHex: 'abcd', isPrfEnabled: undefined }));
        expect(deps.createCredential).toHaveBeenCalledWith(
            expect.objectContaining({
                rp: expect.objectContaining({ id: 'trezor.io' }),
                extensions: { prf: {} },
            }),
            {
                currentOrigin: 'https://trezor.io',
                topFrameOrigin: undefined,
                nativeWindowHandle: WINDOW_HANDLE,
            },
        );
    });

    it('evaluates the PRF with the credential and salt as bytes', async () => {
        const deps = createDeps();

        const result = await createNativeWebauthnAuthenticator(deps).evaluatePrf({
            credentialIdHex: 'abcd',
            saltHex: 'ff00',
        });

        expect(result).toEqual(ok('0102'));
        const [publicKeyOptions] = deps.getCredential.mock.calls[0] ?? [];
        expect(publicKeyOptions?.rpId).toBe('trezor.io');
        expect(publicKeyOptions?.allowCredentials?.[0]?.id).toEqual(new Uint8Array([0xab, 0xcd]));
        expect(publicKeyOptions?.extensions?.prf?.eval?.first).toEqual(
            new Uint8Array([0xff, 0x00]),
        );
    });

    it('reports a missing PRF output', async () => {
        const deps = createDeps();
        deps.getCredential.mockResolvedValue({
            success: true,
            data: {
                credentialId: CREDENTIAL_ID_BASE64URL,
                clientDataJSON: '',
                authenticatorData: '',
                signature: '',
                userHandle: null,
                authenticatorAttachment: 'platform',
            },
        });

        const result = await createNativeWebauthnAuthenticator(deps).evaluatePrf({
            credentialIdHex: 'abcd',
            saltHex: 'ff00',
        });

        expect(result).toEqual(err(EncryptionUnavailable('The assertion carries no PRF output')));
    });

    it('passes on the reason of a failed request', async () => {
        const deps = createDeps();
        deps.createCredential.mockResolvedValue({
            success: false,
            error: 'NotAllowedError',
            errorObject: new Error('not associated with domain trezor.io'),
        });

        const result = await createNativeWebauthnAuthenticator(deps).createCredential();

        expect(result).toEqual(
            err(
                EncryptionUnavailable(
                    'Credential creation failed: NotAllowedError: not associated with domain trezor.io',
                ),
            ),
        );
    });

    it('does not prompt without a window', async () => {
        const deps = createMockDeps<NativeWebauthnAuthenticatorDeps>({
            relyingPartyId: 'trezor.io',
            getNativeWindowHandle: () => undefined,
            createCredential: null,
            getCredential: null,
            getRandomBytes: null,
        });

        const result = await createNativeWebauthnAuthenticator(deps).createCredential();

        expect(result).toEqual(
            err(EncryptionUnavailable('No window to show the passkey prompt in')),
        );
    });
});
