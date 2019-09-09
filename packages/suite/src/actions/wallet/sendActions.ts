import { SEND } from '@wallet-actions/constants';
import { Dispatch } from '@suite-types';

export interface SendActions {
    type: typeof SEND.SET_ADDITIONAL_FORM_VISIBILITY;
    isAdditionalFormVisible: boolean;
}

const toggleAdditionalFormVisibility = (isAdditionalFormVisible: boolean) => (
    dispatch: Dispatch,
) => {
    dispatch({
        type: SEND.SET_ADDITIONAL_FORM_VISIBILITY,
        isAdditionalFormVisible,
    });
};

export default {
    toggleAdditionalFormVisibility,
};
