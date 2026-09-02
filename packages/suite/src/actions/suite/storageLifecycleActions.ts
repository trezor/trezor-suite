import { type ActionCreatorWithPayload, createAction } from '@reduxjs/toolkit';

import { type PreloadStoreAction } from 'src/support/suite/preloadStore';

import { STORAGE } from './constants';

type StorageAction = NonNullable<PreloadStoreAction>;
type StorageLoadPayload = Extract<StorageAction, { type: typeof STORAGE.LOAD }>['payload'];
type StorageErrorPayload = Extract<StorageAction, { type: typeof STORAGE.ERROR }>['payload'];
type StorageCorruptedPayload = Extract<
    StorageAction,
    { type: typeof STORAGE.CORRUPTED }
>['payload'];

// The payload types are annotated explicitly so declaration emit keeps the aliases
// instead of inlining the whole preloaded store shape.
export const storageLoad: ActionCreatorWithPayload<StorageLoadPayload, typeof STORAGE.LOAD> =
    createAction(STORAGE.LOAD);
export const storageError: ActionCreatorWithPayload<StorageErrorPayload, typeof STORAGE.ERROR> =
    createAction(STORAGE.ERROR);
export const storageCorrupted: ActionCreatorWithPayload<
    StorageCorruptedPayload,
    typeof STORAGE.CORRUPTED
> = createAction(STORAGE.CORRUPTED);
