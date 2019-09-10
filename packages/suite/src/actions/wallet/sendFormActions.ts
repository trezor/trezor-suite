import { SEND } from '@wallet-actions/constants';
import { Dispatch, GetState } from '@suite-types';

export interface SendFormActions {
    type: typeof SEND.SET_ADDITIONAL_FORM_VISIBILITY;
}

const toggleAdditionalFormVisibility = () => (dispatch: Dispatch, getState: GetState) => {
    dispatch({
        type: SEND.SET_ADDITIONAL_FORM_VISIBILITY,
    });
};

export { toggleAdditionalFormVisibility };
