import { db } from '@suite/storage';
import SuiteDB from '@trezor/suite-storage';
import { Dispatch, GetState, AppState } from '@suite-types';
import { STORAGE } from './constants/index';

export type StorageActions =
    | { type: typeof STORAGE.LOAD }
    | { type: typeof STORAGE.LOADED; payload: AppState }
    | { type: typeof STORAGE.ERROR; error: any };

export const loadStorage = () => async (dispatch: Dispatch, getState: GetState) => {
    SuiteDB.isDBAvailable(async (isAvailable: boolean) => {
        let suite: Partial<AppState['suite']> | typeof undefined;
        let devices: AppState['devices'] = [];
        if (!isAvailable) {
            // TODO: Display error for the user (eg. redirect to unsupported browser page)
            console.warn('IndexedDB not supported');
        } else {
            //  load state from database
            suite = await db.getItemByPK('suiteSettings', 'suite');
            devices = await db.getItemsExtended('devices');
        }

        const initialState = getState();
        dispatch({
            type: STORAGE.LOADED,
            payload: {
                ...initialState,
                suite: {
                    ...initialState.suite,
                    ...suite,
                },
                devices,
            },
        });
    });
};
