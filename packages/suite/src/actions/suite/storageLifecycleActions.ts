import { type ActionCreatorWithPayload, createAction } from '@reduxjs/toolkit';

import {
    type StorageCorruptedPayload,
    type StorageErrorPayload,
    type StorageLoadPayload,
} from 'src/storage/StorageLoadPayload';

import { STORAGE } from './constants';

export const storageLoad: ActionCreatorWithPayload<StorageLoadPayload, typeof STORAGE.LOAD> =
    createAction<StorageLoadPayload, typeof STORAGE.LOAD>(STORAGE.LOAD);
export const storageError = createAction<StorageErrorPayload, typeof STORAGE.ERROR>(STORAGE.ERROR);
export const storageCorrupted = createAction<StorageCorruptedPayload, typeof STORAGE.CORRUPTED>(
    STORAGE.CORRUPTED,
);

export type StorageAction = ReturnType<
    typeof storageLoad | typeof storageError | typeof storageCorrupted
>;
export type StorageLoadAction = ReturnType<typeof storageLoad>;
