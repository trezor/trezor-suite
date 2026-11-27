import { type ActionCreatorWithPayload, createAction } from '@reduxjs/toolkit';

import { type storageCorrupted, type storageError } from '@suite/suite-lifecycle';

import { type StorageLoadPayload } from '#src/storage/StorageLoadPayload';

import * as STORAGE from './constants/storageConstants';

export const storageLoad: ActionCreatorWithPayload<StorageLoadPayload, typeof STORAGE.LOAD> =
    createAction<StorageLoadPayload, typeof STORAGE.LOAD>(STORAGE.LOAD);

export type StorageAction = ReturnType<
    typeof storageLoad | typeof storageError | typeof storageCorrupted
>;
export type StorageLoadAction = ReturnType<typeof storageLoad>;
