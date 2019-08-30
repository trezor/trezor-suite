import { fetchLocale } from '@suite-actions/languageActions.useNative';
import { db } from '@suite/storage';
import SuiteDB from '@trezor/suite-storage';
import { Dispatch, GetState, AppState } from '@suite-types';
import { STORAGE } from './constants/index';

export type StorageActions =
    | { type: typeof STORAGE.LOAD }
    | { type: typeof STORAGE.LOADED; payload: AppState }
    | { type: typeof STORAGE.ERROR; error: any };

export const loadStorage = () => async (dispatch: Dispatch, getState: GetState) => {
    SuiteDB.isDBAvailable(async (isAvailable: any) => {
        let suiteState: Partial<AppState['suite']> | typeof undefined;
        if (!isAvailable) {
            // TODO: Display error for the user (eg. redirect to unsupported browser page)
            console.warn('IndexedDB not supported');
        } else {
            //  load suite settings from indexedDB
            suiteState = await db.getItemByPK('suiteSettings', 'suite');
            if (suiteState && suiteState.language) {
                await dispatch(fetchLocale(suiteState.language));
            }
        }

        const initialState = getState();
        dispatch({
            type: STORAGE.LOADED,
            payload: {
                ...initialState,
                suite: {
                    ...initialState.suite,
                    ...suiteState,
                },
            },
        });
    });
};
