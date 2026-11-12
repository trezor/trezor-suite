import {
    DecryptionFailed,
    EncryptionLocked,
    EncryptionUnavailable,
    asEncryptedHex,
} from '@suite-common/platform-encryption';
import { createMockDeps } from '@trezor/dependency-injection';
import { type Branded, err, ok } from '@trezor/type-utils';

import {
    PROMPT_COOLDOWN_MS,
    type WebauthnPlatformEncryptionDeps,
    createWebauthnPlatformEncryption,
} from './webauthnPlatformEncryption';

type Secret = string & Branded<'Secret'>;
const secret = 'top secret' as Secret;

const CREDENTIAL_ID_HEX = 'abcd';
const PRF_OUTPUT_HEX = '11'.repeat(32);

const createDeps = (storedCredentialId: string | null, prfOutputHex = PRF_OUTPUT_HEX) => {
    let time = 1_000_000;
    const deps = createMockDeps<WebauthnPlatformEncryptionDeps>({
        webauthnAuthenticator: {
            createCredential: () =>
                Promise.resolve(ok({ credentialIdHex: CREDENTIAL_ID_HEX, isPrfEnabled: true })),
            evaluatePrf: () => Promise.resolve(ok(prfOutputHex)),
        },
        credentialIdStorage: {
            getCredentialId: () => storedCredentialId,
            setCredentialId: () => {},
        },
        now: () => time,
    });

    return {
        deps,
        advanceTime: (ms: number) => {
            time += ms;
        },
    };
};

const encryptOrThrow = async (deps: WebauthnPlatformEncryptionDeps, context?: string) => {
    const result = await createWebauthnPlatformEncryption(deps).encrypt({ value: secret, context });
    if (!result.success) {
        throw new Error('encryption failed');
    }

    return result.payload;
};

describe(createWebauthnPlatformEncryption.name, () => {
    it('creates a credential on the first encryption and stores it once it yields a key', async () => {
        const { deps } = createDeps(null);

        await encryptOrThrow(deps);

        expect(deps.webauthnAuthenticator.createCredential).toHaveBeenCalledTimes(1);
        expect(deps.webauthnAuthenticator.evaluatePrf).toHaveBeenCalledWith({
            credentialIdHex: CREDENTIAL_ID_HEX,
            saltHex: expect.stringMatching(/^[0-9a-f]+$/),
        });
        expect(deps.credentialIdStorage.setCredentialId).toHaveBeenCalledWith(CREDENTIAL_ID_HEX);
    });

    it('asks the authenticator once per session', async () => {
        const { deps } = createDeps(CREDENTIAL_ID_HEX);
        const platformEncryption = createWebauthnPlatformEncryption(deps);

        const [first] = await Promise.all([
            platformEncryption.encrypt({ value: secret }),
            platformEncryption.encrypt({ value: secret }),
        ]);
        if (!first.success) {
            throw new Error('encryption failed');
        }
        await platformEncryption.decrypt({ value: first.payload });

        expect(deps.webauthnAuthenticator.createCredential).not.toHaveBeenCalled();
        expect(deps.webauthnAuthenticator.evaluatePrf).toHaveBeenCalledTimes(1);
    });

    it('asks the passkey again after a lock', async () => {
        const { deps } = createDeps(CREDENTIAL_ID_HEX);
        const platformEncryption = createWebauthnPlatformEncryption(deps);

        await platformEncryption.encrypt({ value: secret });
        platformEncryption.lock();
        await platformEncryption.encrypt({ value: secret });

        expect(deps.webauthnAuthenticator.evaluatePrf).toHaveBeenCalledTimes(2);
    });

    it('decrypts in a new session with the same passkey', async () => {
        const encrypted = await encryptOrThrow(createDeps(CREDENTIAL_ID_HEX).deps);

        const result = await createWebauthnPlatformEncryption(
            createDeps(CREDENTIAL_ID_HEX).deps,
        ).decrypt({ value: encrypted });

        expect(result).toEqual(ok(secret));
    });

    it('starts the ciphertext with the format version', async () => {
        const encrypted = await encryptOrThrow(createDeps(CREDENTIAL_ID_HEX).deps);

        expect(encrypted.startsWith('01')).toBe(true);
    });

    it('binds the ciphertext to its context', async () => {
        const { deps } = createDeps(CREDENTIAL_ID_HEX);
        const encrypted = await encryptOrThrow(deps, 'owner:device-a');
        const platformEncryption = createWebauthnPlatformEncryption(deps);

        expect(
            await platformEncryption.decrypt({ value: encrypted, context: 'owner:device-a' }),
        ).toEqual(ok(secret));
        expect(
            await platformEncryption.decrypt({ value: encrypted, context: 'owner:device-b' }),
        ).toEqual(err(DecryptionFailed()));
        expect(await platformEncryption.decrypt({ value: encrypted })).toEqual(
            err(DecryptionFailed()),
        );
    });

    it('fails to decrypt with a different PRF output', async () => {
        const encrypted = await encryptOrThrow(createDeps(CREDENTIAL_ID_HEX).deps);

        const result = await createWebauthnPlatformEncryption(
            createDeps(CREDENTIAL_ID_HEX, '22'.repeat(32)).deps,
        ).decrypt({ value: encrypted });

        expect(result).toEqual(err(DecryptionFailed()));
    });

    it('refuses an authenticator that reports no PRF support', async () => {
        const { deps } = createDeps(null);
        deps.webauthnAuthenticator.createCredential.mockResolvedValue(
            ok({ credentialIdHex: CREDENTIAL_ID_HEX, isPrfEnabled: false }),
        );

        const result = await createWebauthnPlatformEncryption(deps).encrypt({ value: secret });

        expect(result).toEqual(
            err(EncryptionUnavailable('The authenticator does not support the PRF extension')),
        );
        expect(deps.credentialIdStorage.setCredentialId).not.toHaveBeenCalled();
    });

    it('does not prompt again during the cooldown after a refused prompt', async () => {
        const { deps, advanceTime } = createDeps(CREDENTIAL_ID_HEX);
        deps.webauthnAuthenticator.evaluatePrf.mockResolvedValueOnce(
            err(EncryptionUnavailable('Assertion failed: NotAllowedError')),
        );
        const platformEncryption = createWebauthnPlatformEncryption(deps);

        const refused = await platformEncryption.encrypt({ value: secret });
        const duringCooldown = await platformEncryption.encrypt({ value: secret });
        advanceTime(PROMPT_COOLDOWN_MS);
        const afterCooldown = await platformEncryption.encrypt({ value: secret });

        expect(refused).toEqual(err(EncryptionUnavailable('Assertion failed: NotAllowedError')));
        expect(duringCooldown).toEqual(
            err(EncryptionLocked('The passkey was refused a moment ago')),
        );
        expect(afterCooldown.success).toBe(true);
        expect(deps.webauthnAuthenticator.evaluatePrf).toHaveBeenCalledTimes(2);
    });

    it('does not store a new credential that yields no PRF output', async () => {
        const { deps, advanceTime } = createDeps(null);
        deps.webauthnAuthenticator.evaluatePrf.mockResolvedValueOnce(
            err(EncryptionUnavailable('The assertion carries no PRF output')),
        );
        const platformEncryption = createWebauthnPlatformEncryption(deps);

        const failed = await platformEncryption.encrypt({ value: secret });
        advanceTime(PROMPT_COOLDOWN_MS);
        const retried = await platformEncryption.encrypt({ value: secret });

        expect(failed).toEqual(err(EncryptionUnavailable('The assertion carries no PRF output')));
        expect(retried.success).toBe(true);
        expect(deps.credentialIdStorage.setCredentialId).toHaveBeenCalledTimes(1);
    });

    it.each(['zz', '00'.repeat(64), `02${'00'.repeat(60)}`])(
        'rejects malformed ciphertext %p without asking the authenticator',
        async value => {
            const { deps } = createDeps(CREDENTIAL_ID_HEX);

            const result = await createWebauthnPlatformEncryption(deps).decrypt({
                value: asEncryptedHex<Secret>(value),
            });

            expect(result).toEqual(err(DecryptionFailed()));
            expect(deps.webauthnAuthenticator.evaluatePrf).not.toHaveBeenCalled();
        },
    );

    it('cannot decrypt without a stored credential', async () => {
        const { deps } = createDeps(null);

        const result = await createWebauthnPlatformEncryption(deps).decrypt({
            value: asEncryptedHex<Secret>(`01${'00'.repeat(64)}`),
        });

        expect(result).toEqual(err(EncryptionUnavailable('No WebAuthn credential is registered')));
        expect(deps.webauthnAuthenticator.createCredential).not.toHaveBeenCalled();
    });
});
