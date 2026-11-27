import { type loadStoragePayload } from './loadStoragePayload';

export type StorageLoadPayload = Awaited<ReturnType<typeof loadStoragePayload>>;
