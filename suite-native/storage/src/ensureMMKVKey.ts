export const ENCRYPTION_KEY = 'STORAGE_ENCRYPTION_KEY';
import { captureException } from '@sentry/react-native';
import { getRandomBytes } from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

export type EnsureMMKVKey = () => Promise<string | null>;

export type EnsureMMKVKeyDep = {
    ensureMMKVKey: EnsureMMKVKey;
};

export const createEnsureMMKVKey = (): EnsureMMKVKey => async () => {
    let secureKey: string | null = null;
    try {
        secureKey = await SecureStore.getItemAsync(ENCRYPTION_KEY);
    } catch (error) {
        // If there is an error, report it and try to read one more time.
        captureException(error, { tags: { attempt: 1 } });
        try {
            // There were some trouble reading from the SecureStore,
            // let's wait a bit to make sure it wasn't just temporary error.
            await new Promise(resolve => setTimeout(resolve, 100));
            secureKey = await SecureStore.getItemAsync(ENCRYPTION_KEY);
        } catch (error) {
            captureException(error, { tags: { attempt: 2 } });

            // It's not possible to read from SecureStore,
            // and we don't want to set a new key or reset storage without user interaction.
            // It might happen on the background when the phone is locked.
            return null;
        }
    }

    if (secureKey !== null) return secureKey;

    // If we are here, it means that we have no encryption key in storage.
    // We need to generate a new one. This should happen only once on first app start.
    secureKey = Buffer.from(getRandomBytes(16)).toString('hex');
    await SecureStore.setItemAsync(ENCRYPTION_KEY, secureKey);

    return secureKey;
};
