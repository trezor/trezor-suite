import { State, Dispatch, GetState } from '@suite-types/index';
import * as STORAGE from './constants/storage';

export type StorageActions =
    | {
          type: typeof STORAGE.LOAD;
      }
    | {
          type: typeof STORAGE.LOADED;
          payload: State;
      }
    | {
          type: typeof STORAGE.ERROR;
          error: any;
      };

export const load = () => async (dispatch: Dispatch, getState: GetState) => {
    // TODO: load state from indexed db
    const state: State = await new Promise(resolve => {
        setTimeout(() => {
            const s = getState();
            resolve({
                ...s,
                suite: {
                    ...s.suite,
                    loaded: true,
                },
            });
        }, 1000);
    });

    return dispatch({
        type: STORAGE.LOADED,
        payload: state,
    });
};
