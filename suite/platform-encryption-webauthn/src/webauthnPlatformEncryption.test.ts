import {
    DecryptionFailed,
    EncryptionUnavailable,
    asEncryptedHex,
} from '@suite-common/platform-encryption';
import { createMockDeps } from '@trezor/dependency-injection';
import { type Branded, err, ok } from '@trezor/type-utils';

import {
    type WebauthnPlatformEncryptionDeps,
    createWebauthnPlatformEncryption,
} from './webauthnPlatformEncryption';

type Secret = string & Branded<'Secret'>;
const secret = 'top secret' as Secret;

const CREDENTIAL_ID_HEX = 'abcd';
const PRF_OUTPUT_HEX = '11'.repeat(32);

const createDeps = (storedCredentialId: string | null) =>
    createMockDeps<WebauthnPlatformEncryptionDeps>({
        webauthnAuthenticator: {
            createCredential: () =>
                Promise.resolve(ok({ credentialIdHex: CREDENTIAL_ID_HEX, isPrfEnabled: true })),
            evaluatePrf: () => Promise.resolve(ok(PRF_OUTPUT_HEX)),
        },
        credentialIdStorage: {
            getCredentialId: () => storedCredentialId,
            setCredentialId: () => {},
        },
    });

describe(createWebauthnPlatformEncryption.name, () => {
    it('creates and stores a credential on the first encryption', async () => {
        const deps = createDeps(null);
        const platformEncryption = createWebauthnPlatformEncryption(deps);

        const result = await platformEncryption.encrypt({ value: secret });

        expect(result.success).toBe(true);
        expect(deps.webauthnAuthenticator.createCredential).toHaveBeenCalledTimes(1);
        expect(deps.credentialIdStorage.setCredentialId).toHaveBeenCalledWith(CREDENTIAL_ID_HEX);
    });

    it('reuses the stored credential', async () => {
        const deps = createDeps(CREDENTIAL_ID_HEX);
        const platformEncryption = createWebauthnPlatformEncryption(deps);

        await platformEncryption.encrypt({ value: secret });

        expect(deps.webauthnAuthenticator.createCredential).not.toHaveBeenCalled();
        expect(deps.webauthnAuthenticator.evaluatePrf).toHaveBeenCalledWith({
            credentialIdHex: CREDENTIAL_ID_HEX,
            saltHex: expect.stringMatching(/^[0-9a-f]{64}$/),
        });
    });

    it('decrypts what it encrypted', async () => {
        const platformEncryption = createWebauthnPlatformEncryption(createDeps(CREDENTIAL_ID_HEX));

        const encrypted = await platformEncryption.encrypt({ value: secret });
        if (!encrypted.success) {
            throw new Error('encryption failed');
        }

        expect(await platformEncryption.decrypt({ value: encrypted.payload })).toEqual(ok(secret));
    });

    it('fails to decrypt with a different PRF output', async () => {
        const deps = createDeps(CREDENTIAL_ID_HEX);
        const platformEncryption = createWebauthnPlatformEncryption(deps);
        const encrypted = await platformEncryption.encrypt({ value: secret });
        if (!encrypted.success) {
            throw new Error('encryption failed');
        }

        deps.webauthnAuthenticator.evaluatePrf.mockResolvedValue(ok('22'.repeat(32)));

        expect(await platformEncryption.decrypt({ value: encrypted.payload })).toEqual(
            err(DecryptionFailed()),
        );
    });

    it('refuses an authenticator without the PRF extension', async () => {
        const deps = createDeps(null);
        deps.webauthnAuthenticator.createCredential.mockResolvedValue(
            ok({ credentialIdHex: CREDENTIAL_ID_HEX, isPrfEnabled: false }),
        );
        const platformEncryption = createWebauthnPlatformEncryption(deps);

        const result = await platformEncryption.encrypt({ value: secret });

        expect(result).toEqual(
            err(EncryptionUnavailable('The authenticator does not support the PRF extension')),
        );
        expect(deps.credentialIdStorage.setCredentialId).not.toHaveBeenCalled();
    });

    it('rejects malformed ciphertext without asking the authenticator', async () => {
        const deps = createDeps(CREDENTIAL_ID_HEX);
        const platformEncryption = createWebauthnPlatformEncryption(deps);

        const result = await platformEncryption.decrypt({ value: asEncryptedHex<Secret>('zz') });

        expect(result).toEqual(err(DecryptionFailed()));
        expect(deps.webauthnAuthenticator.evaluatePrf).not.toHaveBeenCalled();
    });

    it('cannot decrypt without a stored credential', async () => {
        const platformEncryption = createWebauthnPlatformEncryption(createDeps(null));

        const result = await platformEncryption.decrypt({
            value: asEncryptedHex<Secret>('00'.repeat(64)),
        });

        expect(result).toEqual(err(EncryptionUnavailable('No WebAuthn credential is registered')));
    });
});
