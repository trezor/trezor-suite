import { SEND } from '@wallet-actions/constants';
import { Dispatch, GetState } from '@suite-types';

export interface SendActions {
    type: typeof SEND.SET_ADDITIONAL_FORM_VISIBILITY;
    id: string;
}

const toggleAdditionalFormVisibility = () => (dispatch: Dispatch, getState: GetState) => {
    const {
        wallet: {
            selectedAccount: { account },
        },
    } = getState();
    if (!account) return null;

    const { accountType, network, index } = account;
    const id = `${network}-${accountType}-${index}`;

    dispatch({
        type: SEND.SET_ADDITIONAL_FORM_VISIBILITY,
        id,
    });
};

export { toggleAdditionalFormVisibility };
