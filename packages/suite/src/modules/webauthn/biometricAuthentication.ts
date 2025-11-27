import { clearCachedEncryptionKeyAndSalt } from './encryptedStorage';
import { getStore } from './storage';
import {
    createWebAuthnCredential,
    isWebAuthnFullySupported,
    removeWebAuthnCredential,
} from './webAuthn';

export async function isBiometricAuthenticationEnabled() {
    if (!(await isWebAuthnFullySupported())) {
        return false;
    }

    return await getStore('webauthn').get('enabled');
}

export async function enableBiometricAuthentication() {
    if (await isBiometricAuthenticationEnabled()) {
        return;
    }

    const credentials = await getStore('webauthn').get('credentials');

    // TODO: handle the flow when the credential is "discored" from an authenticator but not avail. in local storage
    // await getWebAuthnCredentials(credentials);

    if (credentials.length === 0) {
        const credential = await createWebAuthnCredential();

        await getStore('webauthn').set('credentials', [...credentials, credential]);
    } else {
        // TODO: retrieve the credential from the authenticator
        // await getWebAuthnCredentials(credentials);
    }

    await getStore('webauthn').set('enabled', true);
}

export async function disableBiometricAuthentication() {
    if (!(await isBiometricAuthenticationEnabled())) {
        return;
    }

    const credentials = await getStore('webauthn').get('credentials');

    for (const credential of credentials) {
        await removeWebAuthnCredential(credential.credentialId);
    }

    await getStore('webauthn').set('credentials', []);
    await getStore('webauthn').set('enabled', false);

    clearCachedEncryptionKeyAndSalt();
}
