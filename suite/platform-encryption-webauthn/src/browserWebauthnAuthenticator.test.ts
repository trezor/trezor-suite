import { EncryptionUnavailable } from '@suite-common/platform-encryption';
import { createMockDeps } from '@trezor/dependency-injection';
import { err, ok } from '@trezor/type-utils';

import {
    type BrowserWebauthnAuthenticatorDeps,
    createBrowserWebauthnAuthenticator,
} from './browserWebauthnAuthenticator';

const createPublicKeyCredential = (extensionResults: AuthenticationExtensionsClientOutputs) =>
    ({
        type: 'public-key',
        id: 'credential',
        rawId: new Uint8Array([0xab, 0xcd]).buffer,
        getClientExtensionResults: () => extensionResults,
    }) as unknown as Credential;

const createDeps = () =>
    createMockDeps<BrowserWebauthnAuthenticatorDeps>({
        isWebauthnAvailable: () => true,
        getRelyingPartyId: () => 'localhost',
        createCredential: () =>
            Promise.resolve(createPublicKeyCredential({ prf: { enabled: true } })),
        getCredential: () =>
            Promise.resolve(
                createPublicKeyCredential({
                    prf: { results: { first: new Uint8Array([1, 2]).buffer } },
                }),
            ),
    });

describe(createBrowserWebauthnAuthenticator.name, () => {
    it('creates a credential with the PRF extension for the relying party', async () => {
        const deps = createDeps();

        const result = await createBrowserWebauthnAuthenticator(deps).createCredential();

        expect(result).toEqual(ok({ credentialIdHex: 'abcd', isPrfEnabled: true }));
        expect(deps.createCredential).toHaveBeenCalledWith(
            expect.objectContaining({
                publicKey: expect.objectContaining({
                    rp: expect.objectContaining({ id: 'localhost' }),
                    extensions: { prf: {} },
                }),
            }),
        );
    });

    it('evaluates the PRF with the given credential and salt', async () => {
        const deps = createDeps();

        const result = await createBrowserWebauthnAuthenticator(deps).evaluatePrf({
            credentialIdHex: 'abcd',
            saltHex: 'ff00',
        });

        expect(result).toEqual(ok('0102'));
        const options = deps.getCredential.mock.calls[0]?.[0];
        expect(options?.publicKey?.allowCredentials?.[0]?.id).toEqual(new Uint8Array([0xab, 0xcd]));
        expect(options?.publicKey?.extensions?.prf?.eval?.first).toEqual(
            new Uint8Array([0xff, 0x00]),
        );
    });

    it('reports a missing PRF output', async () => {
        const deps = createDeps();
        deps.getCredential.mockResolvedValue(createPublicKeyCredential({}));

        const result = await createBrowserWebauthnAuthenticator(deps).evaluatePrf({
            credentialIdHex: 'abcd',
            saltHex: 'ff00',
        });

        expect(result).toEqual(err(EncryptionUnavailable('The assertion carries no PRF output')));
    });

    it('reports a rejected request', async () => {
        const deps = createDeps();
        deps.createCredential.mockRejectedValue(new DOMException('denied', 'NotAllowedError'));

        const result = await createBrowserWebauthnAuthenticator(deps).createCredential();

        expect(result).toEqual(
            err(EncryptionUnavailable('Credential creation failed: NotAllowedError: denied')),
        );
    });

    it('does not call WebAuthn when it is unavailable', async () => {
        const deps = createMockDeps<BrowserWebauthnAuthenticatorDeps>({
            isWebauthnAvailable: () => false,
            getRelyingPartyId: null,
            createCredential: null,
            getCredential: null,
        });

        const result = await createBrowserWebauthnAuthenticator(deps).createCredential();

        expect(result).toEqual(
            err(EncryptionUnavailable('WebAuthn is not available in this context')),
        );
    });

    it('rejects an invalid salt before calling WebAuthn', async () => {
        const deps = createDeps();

        const result = await createBrowserWebauthnAuthenticator(deps).evaluatePrf({
            credentialIdHex: 'abcd',
            saltHex: 'not hex',
        });

        expect(result).toEqual(err(EncryptionUnavailable('Invalid credential id or salt')));
        expect(deps.getCredential).not.toHaveBeenCalled();
    });
});
