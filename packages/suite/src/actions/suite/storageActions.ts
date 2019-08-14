import { fetchLocale } from '@suite-actions/languageActions.useNative';
import * as db from '@suite/storage';
import { Dispatch, GetState } from '@suite-types';
import { STORAGE } from './constants/index';

export type StorageActions =
    | { type: typeof STORAGE.LOAD }
    | { type: typeof STORAGE.LOADED }
    | { type: typeof STORAGE.ERROR; error: any };

export const loadStorage = () => async (dispatch: Dispatch, _getState: GetState) => {
    db.isIndexedDBAvailable(async (isAvailable: any) => {
        if (!isAvailable) {
            // TODO: Display error for the user (eg. redirect to unsupported browser page)
            console.warn('IndexedDB not supported');
        } else {
            //  load suite settings from indexedDB
            const suiteSettings = await db.getSuiteSettings();
            if (suiteSettings && suiteSettings.language) {
                // @ts-ignore
                dispatch(fetchLocale(suiteSettings.language));
            }
        }
        return dispatch({
            type: STORAGE.LOADED,
        });
    });
};
