import { createAction } from '@reduxjs/toolkit';

const STORAGE_ERROR = '@storage/error';
const STORAGE_CORRUPTED = '@storage/corrupted';

export type StorageErrorPayload = 'blocked' | 'blocking';

export type StorageCorruptedPayload = string | undefined;

export const storageError = createAction<StorageErrorPayload, typeof STORAGE_ERROR>(STORAGE_ERROR);
export const storageCorrupted = createAction<StorageCorruptedPayload, typeof STORAGE_CORRUPTED>(
    STORAGE_CORRUPTED,
);
