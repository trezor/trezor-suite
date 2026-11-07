import { Alert } from 'react-native';
import * as MMKV from 'react-native-mmkv';
import RNRestart from 'react-native-restart';

import { captureException, flush } from '@sentry/react-native';
import * as SecureStore from 'expo-secure-store';

import { unecryptedJotaiStorage } from './atomWithUnecryptedStorage';
import {
    ENCRYPTION_KEY,
    type EnsureEncryptionKey,
    type EnsureEncryptionKeyDep,
    type StorageEncryptionKey,
} from './createEnsureEncryptionKey';
import { ENCRYPTED_STORAGE_ID } from './encryptedStorageId';
import { createMMKVStorage } from './mmkvStorage';
import { mockAppState } from '../mocks/mockAppState';

jest.mock('react-native-mmkv', () => {
    const actual = jest.requireActual<typeof MMKV>('react-native-mmkv');

    return {
        ...actual,
        createMMKV: jest.fn(actual.createMMKV),
        deleteMMKV: jest.fn(),
        existsMMKV: jest.fn(),
    };
});
jest.mock('react-native-restart', () => ({ __esModule: true, default: { restart: jest.fn() } }));
jest.mock('@sentry/react-native', () => ({
    captureException: jest.fn(),
    captureMessage: jest.fn(),
    flush: jest.fn(),
}));
jest.mock('expo-secure-store', () => ({ deleteItemAsync: jest.fn() }));

const encryptionKey = 'test-encryption-key' as StorageEncryptionKey;
const encryptionKeyPromise = Promise.resolve(encryptionKey);
const deps: EnsureEncryptionKeyDep = {
    ensureEncryptionKey: () => encryptionKeyPromise,
};
const unreadableKeyDeps: EnsureEncryptionKeyDep = {
    ensureEncryptionKey: () => Promise.resolve(null),
};

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

const pressAlertButton = (buttonText: string) => {
    const buttons = jest.mocked(Alert.alert).mock.lastCall?.[2];
    const button = buttons?.find(({ text }) => text === buttonText);

    if (!button?.onPress) {
        throw new Error(`Alert button "${buttonText}" not found`);
    }

    button.onPress();
};

describe('createMMKVStorage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockAppState('active');
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('shares one MMKV instance across concurrent initialization and subsequent operations', async () => {
        const storage = createMMKVStorage(deps);

        const [firstInstance, secondInstance] = await Promise.all([
            storage.getMMKV(),
            storage.getMMKV(),
            ...Array.from({ length: 24 }, (_, index) =>
                storage.getItem(`persist:reducer-${index}`),
            ),
            storage.setItem('test-key', 'test-value'),
            storage.removeItem('missing-key'),
        ]);

        expect(firstInstance).toBe(secondInstance);
        expect(MMKV.createMMKV).toHaveBeenCalledTimes(1);
        expect(MMKV.createMMKV).toHaveBeenCalledWith({ id: ENCRYPTED_STORAGE_ID, encryptionKey });
        expect(await storage.getMMKV()).toBe(firstInstance);
        expect(await storage.getItem('test-key')).toBe('test-value');

        await storage.removeItem('test-key');

        expect(await storage.getItem('test-key')).toBeUndefined();
        expect(MMKV.createMMKV).toHaveBeenCalledTimes(1);
    });

    it('allows initialization to be retried after MMKV creation fails', async () => {
        const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
        const error = new Error('Unable to open storage');
        jest.mocked(MMKV.createMMKV).mockImplementationOnce(() => {
            throw error;
        });
        const storage = createMMKVStorage(deps);

        await expect(storage.getMMKV()).rejects.toThrow(error);
        expect(alertSpy).toHaveBeenCalledTimes(1);

        const instance = await storage.getMMKV();

        expect(await storage.getMMKV()).toBe(instance);
        expect(MMKV.createMMKV).toHaveBeenCalledTimes(2);
    });

    it('does not create MMKV when the encryption key is unreadable', async () => {
        const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
        const storage = createMMKVStorage(unreadableKeyDeps);

        await expect(storage.getMMKV()).rejects.toThrow('Encryption key is unreadable!');

        expect(MMKV.createMMKV).not.toHaveBeenCalled();
        expect(alertSpy).toHaveBeenCalledTimes(1);
    });

    it('retries initialization without an alert once the app becomes active', async () => {
        const { changeAppState, getListenerCount } = mockAppState('background');
        const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
        const lockedKeyDeps: EnsureEncryptionKeyDep = {
            ensureEncryptionKey: jest
                .fn<ReturnType<EnsureEncryptionKey>, Parameters<EnsureEncryptionKey>>()
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(encryptionKey),
        };
        const storage = createMMKVStorage(lockedKeyDeps);

        const mmkvPromise = storage.getMMKV();
        await flushPromises();
        changeAppState('inactive');
        await flushPromises();

        expect(lockedKeyDeps.ensureEncryptionKey).toHaveBeenCalledTimes(1);
        expect(alertSpy).not.toHaveBeenCalled();

        changeAppState('active');
        const instance = await mmkvPromise;

        expect(await storage.getMMKV()).toBe(instance);
        expect(lockedKeyDeps.ensureEncryptionKey).toHaveBeenCalledTimes(2);
        expect(MMKV.createMMKV).toHaveBeenCalledTimes(1);
        expect(alertSpy).not.toHaveBeenCalled();
        expect(getListenerCount()).toBe(0);
    });

    it('retries without an alert after MMKV creation fails in background', async () => {
        const { changeAppState } = mockAppState('background');
        const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
        jest.mocked(MMKV.createMMKV).mockImplementationOnce(() => {
            throw new Error('Unable to open storage');
        });
        const storage = createMMKVStorage(deps);

        const mmkvPromise = storage.getMMKV();
        await flushPromises();
        changeAppState('active');
        await mmkvPromise;

        expect(MMKV.createMMKV).toHaveBeenCalledTimes(2);
        expect(alertSpy).not.toHaveBeenCalled();
    });

    it('retries once before the alert when an attempt started in background fails after the app became active', async () => {
        const { changeAppState } = mockAppState('background');
        const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
        let resolveBackgroundKey: (encryptionKey: StorageEncryptionKey | null) => void = () => {};
        const backgroundKeyDeps: EnsureEncryptionKeyDep = {
            ensureEncryptionKey: jest
                .fn<ReturnType<EnsureEncryptionKey>, Parameters<EnsureEncryptionKey>>()
                .mockReturnValueOnce(
                    new Promise(resolve => {
                        resolveBackgroundKey = resolve;
                    }),
                )
                .mockResolvedValueOnce(null),
        };
        const storage = createMMKVStorage(backgroundKeyDeps);

        const mmkvPromise = storage.getMMKV();
        changeAppState('active');
        resolveBackgroundKey(null);

        await expect(mmkvPromise).rejects.toThrow('Encryption key is unreadable!');
        expect(backgroundKeyDeps.ensureEncryptionKey).toHaveBeenCalledTimes(2);
        expect(alertSpy).toHaveBeenCalledTimes(1);
    });

    it('shows one alert to concurrent callers when the retry in foreground fails', async () => {
        const { changeAppState, getListenerCount } = mockAppState('background');
        const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
        const storage = createMMKVStorage(unreadableKeyDeps);

        const results = Promise.allSettled([
            storage.getMMKV(),
            storage.getMMKV(),
            storage.getItem('persist:root'),
        ]);
        await flushPromises();

        expect(getListenerCount()).toBe(1);
        expect(alertSpy).not.toHaveBeenCalled();

        changeAppState('active');

        expect(await results).toEqual(
            Array(3).fill({
                status: 'rejected',
                reason: new Error('Encryption key is unreadable!'),
            }),
        );
        expect(alertSpy).toHaveBeenCalledTimes(1);
        expect(getListenerCount()).toBe(0);
    });

    describe('storage alert', () => {
        const showStorageAlert = async () => {
            const storage = createMMKVStorage(unreadableKeyDeps);

            await expect(storage.getMMKV()).rejects.toThrow('Encryption key is unreadable!');
        };

        const expectNothingDeleted = () => {
            expect(MMKV.deleteMMKV).not.toHaveBeenCalled();
            expect(SecureStore.deleteItemAsync).not.toHaveBeenCalled();
            expect(unecryptedJotaiStorage.clearAll).not.toHaveBeenCalled();
            expect(RNRestart.restart).not.toHaveBeenCalled();
        };

        beforeEach(() => {
            jest.spyOn(Alert, 'alert').mockImplementation(() => {});
            jest.spyOn(unecryptedJotaiStorage, 'clearAll');
            jest.mocked(MMKV.existsMMKV).mockReturnValue(false);
            jest.mocked(SecureStore.deleteItemAsync).mockResolvedValue(undefined);
            jest.mocked(flush).mockResolvedValue(true);
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('asks for confirmation before clearing app storage', async () => {
            await showStorageAlert();

            expect(Alert.alert).toHaveBeenLastCalledWith(
                'Unable to load app data',
                expect.any(String),
                expect.any(Array),
                { cancelable: false },
            );

            pressAlertButton('Clear app storage');

            expect(Alert.alert).toHaveBeenLastCalledWith(
                'Clear app storage?',
                expect.any(String),
                expect.any(Array),
                { cancelable: false },
            );
            expectNothingDeleted();
        });

        it('shows the storage alert again when clearing is cancelled', async () => {
            await showStorageAlert();
            pressAlertButton('Clear app storage');
            pressAlertButton('Cancel');
            await flushPromises();

            expect(Alert.alert).toHaveBeenCalledTimes(3);
            expect(Alert.alert).toHaveBeenLastCalledWith(
                'Unable to load app data',
                expect.any(String),
                expect.any(Array),
                { cancelable: false },
            );
            expectNothingDeleted();
        });

        it('deletes encrypted storage, its key and unencrypted storage before restarting', async () => {
            await showStorageAlert();
            pressAlertButton('Clear app storage');
            pressAlertButton('Clear app storage');
            await flushPromises();

            expect(MMKV.deleteMMKV).toHaveBeenCalledWith(ENCRYPTED_STORAGE_ID);
            expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(ENCRYPTION_KEY);
            expect(RNRestart.restart).toHaveBeenCalledTimes(1);

            // A function that was not called gets NaN, which fails every comparison below.
            const [deleteStorageOrder = NaN] = jest.mocked(MMKV.deleteMMKV).mock
                .invocationCallOrder;
            const [deleteKeyOrder = NaN] = jest.mocked(SecureStore.deleteItemAsync).mock
                .invocationCallOrder;
            const [clearUnencryptedStorageOrder = NaN] = jest.mocked(
                unecryptedJotaiStorage.clearAll,
            ).mock.invocationCallOrder;
            const [flushOrder = NaN] = jest.mocked(flush).mock.invocationCallOrder;
            const [restartOrder = NaN] = jest.mocked(RNRestart.restart).mock.invocationCallOrder;

            expect(deleteStorageOrder).toBeLessThan(deleteKeyOrder);
            expect(deleteKeyOrder).toBeLessThan(clearUnencryptedStorageOrder);
            expect(clearUnencryptedStorageOrder).toBeLessThan(flushOrder);
            expect(flushOrder).toBeLessThan(restartOrder);
        });

        it('waits at most 2 seconds for Sentry to send its events before restarting', async () => {
            jest.useFakeTimers();
            jest.mocked(flush).mockReturnValue(new Promise(() => {}));

            await showStorageAlert();
            pressAlertButton('Clear app storage');
            pressAlertButton('Clear app storage');
            await jest.advanceTimersByTimeAsync(1999);

            expect(flush).toHaveBeenCalledTimes(1);
            expect(RNRestart.restart).not.toHaveBeenCalled();

            await jest.advanceTimersByTimeAsync(1);

            expect(RNRestart.restart).toHaveBeenCalledTimes(1);
        });

        it('reports failed deletions and restarts anyway', async () => {
            const keyDeletionError = new Error('Keychain unavailable');
            jest.mocked(MMKV.existsMMKV).mockReturnValue(true);
            jest.mocked(SecureStore.deleteItemAsync).mockRejectedValue(keyDeletionError);

            await showStorageAlert();
            pressAlertButton('Clear app storage');
            pressAlertButton('Clear app storage');
            await flushPromises();

            expect(captureException).toHaveBeenCalledWith(
                new Error('Encrypted storage still exists after deletion'),
                { tags: { storageKeyFailure: 'delete-failed', appState: 'active' } },
            );
            expect(captureException).toHaveBeenCalledWith(keyDeletionError, {
                tags: { storageKeyFailure: 'delete-failed', appState: 'active' },
            });
            expect(unecryptedJotaiStorage.clearAll).toHaveBeenCalledTimes(1);
            expect(RNRestart.restart).toHaveBeenCalledTimes(1);
        });
    });
});
