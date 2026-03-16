import { type createMMKVStorage } from './mmkvStorage';

export type MMKVStorageType = ReturnType<typeof createMMKVStorage>;

export const createMMKVStorageMock = (): MMKVStorageType => ({
    getMMKV: jest.fn().mockReturnValue(
        Promise.resolve({
            set: jest.fn(),
            getString: jest.fn(),
            remove: jest.fn(),
            clearAll: jest.fn(),
        }),
    ),
    setItem: jest.fn().mockResolvedValue(true),
    getItem: jest.fn().mockResolvedValue(null),
    removeItem: jest.fn().mockResolvedValue(true),
});
