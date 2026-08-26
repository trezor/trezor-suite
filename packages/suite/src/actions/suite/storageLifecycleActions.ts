import { createAction } from '@reduxjs/toolkit';

import { type PreloadStoreAction } from 'src/support/suite/preloadStore';

import { STORAGE } from './constants';

type StorageAction = NonNullable<PreloadStoreAction>;
type StorageLoadPayload = Extract<StorageAction, { type: typeof STORAGE.LOAD }>['payload'];
type StorageErrorPayload = Extract<StorageAction, { type: typeof STORAGE.ERROR }>['payload'];
type StorageCorruptedPayload = Extract<
    StorageAction,
    { type: typeof STORAGE.CORRUPTED }
>['payload'];

export const storageLoad = createAction<StorageLoadPayload>(STORAGE.LOAD);
export const storageError = createAction<StorageErrorPayload>(STORAGE.ERROR);
export const storageCorrupted = createAction<StorageCorruptedPayload>(STORAGE.CORRUPTED);
