import { safeStorage } from 'electron';

import { DecryptionFailed } from '@suite-common/platform-encryption';
import { ok } from '@trezor/type-utils';

import { init } from './safeStorage';

type IpcHandler = (ipcEvent: never, params: { value: string }) => unknown;

const mockIpcHandlers = new Map<string, IpcHandler>();

jest.mock('electron', () => ({
    safeStorage: {
        decryptString: jest.fn(),
        encryptString: jest.fn(),
        getSelectedStorageBackend: jest.fn(() => 'gnome_libsecret'),
        isEncryptionAvailable: jest.fn(() => true),
    },
    ipcMain: {
        handle: (channel: string, handler: IpcHandler) => {
            mockIpcHandlers.set(channel, handler);
        },
    },
}));

jest.mock('@trezor/ipc-proxy', () => ({
    validateIpcMessage: jest.fn(),
    isSenderFrameDestroyed: jest.fn(),
}));

const delegatedIdentityKey = '0c9d40cd155e7ddb93e7b3c7b2acd8d75e7a3ebd543a3504c8f8164fb692772b';

describe('safeStorage', () => {
    beforeAll(() => {
        init({} as never);
    });

    const getDecryptHandler = () => {
        const registeredHandler = mockIpcHandlers.get('safe-storage/decrypt');

        if (registeredHandler === undefined) {
            throw new Error('safe-storage/decrypt handler was not registered');
        }

        return registeredHandler;
    };

    it('returns a supported decrypted value', async () => {
        jest.mocked(safeStorage.decryptString).mockReturnValue(delegatedIdentityKey);

        const result = await getDecryptHandler()({} as never, { value: '00' });

        // Restricting the oracle must not make persisted Suite secrets undecryptable.
        expect(result).toEqual(ok(delegatedIdentityKey));
    });

    it('rejects an unsupported decrypted value', async () => {
        jest.mocked(safeStorage.decryptString).mockReturnValue('arbitrary plaintext');

        const result = await getDecryptHandler()({} as never, { value: '00' });

        // The renderer can call this IPC directly, so this assertion prevents the handler from
        // becoming an unrestricted safeStorage decryption oracle.
        expect(result).toEqual({ success: false, error: DecryptionFailed() });
    });
});
