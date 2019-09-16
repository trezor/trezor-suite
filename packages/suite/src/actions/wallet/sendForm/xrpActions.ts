import { SEND } from '@wallet-actions/constants';
import { Dispatch, GetState } from '@suite-types';

export type SendFormXrpActions = {
    type: typeof SEND.HANDLE_XRP_DESTINATION_TAG_CHANGE;
    destinationTag: string;
};

/*
    Change value in input "destination tag"
 */
const handleDestinationTagChange = (destinationTag: string) => (
    dispatch: Dispatch,
    getState: GetState,
) => {
    const { account } = getState().wallet.selectedAccount;
    if (!account) return null;

    dispatch({
        type: SEND.HANDLE_XRP_DESTINATION_TAG_CHANGE,
        destinationTag,
    });
};

export { handleDestinationTagChange };
