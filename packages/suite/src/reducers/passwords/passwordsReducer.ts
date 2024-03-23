import produce from 'immer';

import { STORAGE,  } from 'src/actions/suite/constants';
import * as PASSWORDS from 'src/actions/passwords/constants/passwordsConstants';

import { Action, TrezorDevice } from 'src/types/suite';

import { SuiteRootState } from './suiteReducer';

export type PasswordsState = {
    /**
     * filename associated with deviceState
     */
    filename: {[deviceState: string]: string}
}

export const initialState = {
    filename: {},
};

const passwordsReducer = (state = initialState, action: Action): PasswordsState =>
    produce(state, draft => {
        switch (action.type) {
            case STORAGE.LOAD:
                return {
                    ...state,
                    ...action.payload.passwords,
                };
            case PASSWORDS.SET_FILENAME:
                console.log(action.payload.deviceState);
                console.log(draft.filename)
                draft.filename['s'] = action.payload.filename;
                break;
            
            // no default
        }
    });


export default passwordsReducer;
