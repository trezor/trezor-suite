import { fetchLocale } from '@suite-actions/languageActions.useNative';
import { db } from '@suite/storage';
import SuiteDB from '@trezor/suite-storage';
import { Dispatch, GetState } from '@suite-types';
import { STORAGE } from './constants/index';

export type StorageActions =
    | { type: typeof STORAGE.LOAD }
    | { type: typeof STORAGE.LOADED }
    | { type: typeof STORAGE.ERROR; error: any };

export const loadStorage = () => async (dispatch: Dispatch, _getState: GetState) => {
    SuiteDB.isDBAvailable(async (isAvailable: any) => {
        if (!isAvailable) {
            // TODO: Display error for the user (eg. redirect to unsupported browser page)
            console.warn('IndexedDB not supported');
        } else {
            //  load suite settings from indexedDB
            const suiteSettings = await db.getItemByPK('suiteSettings', 'suite');
            if (suiteSettings) {
                await dispatch(fetchLocale(suiteSettings.language));
            }
        }
        dispatch({
            type: STORAGE.LOADED,
        });
    });
};
