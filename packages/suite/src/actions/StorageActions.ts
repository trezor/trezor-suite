import { State, Dispatch, GetState } from '@suite/types';

export const LOAD = '@storage/load';
export const LOADED = '@storage/loaded';
export const ERROR = '@storage/error';

export type StorageActions =
    | {
          type: typeof LOAD;
      }
    | {
        type: typeof LOADED;
        payload: State;
      }
    | {
          type: typeof ERROR;
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
        type: LOADED,
        payload: state,
    });
};


