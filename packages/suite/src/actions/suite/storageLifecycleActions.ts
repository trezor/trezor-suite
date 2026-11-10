import { type ActionCreatorWithPayload, createAction } from '@reduxjs/toolkit';

import { STORAGE } from './constants';
import {
    type StorageCorruptedPayload,
    type StorageErrorPayload,
    type StorageLoadPayload,
} from '../../storage/StorageLoadPayload';

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
