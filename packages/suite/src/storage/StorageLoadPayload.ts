import { type loadStoragePayload } from './loadStoragePayload';

export type StorageLoadPayload = Awaited<ReturnType<typeof loadStoragePayload>>;

export type StorageErrorPayload = 'blocked' | 'blocking';

export type StorageCorruptedPayload = string | undefined;
