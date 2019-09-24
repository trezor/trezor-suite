import TrezorConnect from 'trezor-connect';
import { SEND } from '@wallet-actions/constants';
import { Dispatch, GetState } from '@suite-types';

export interface SendFormXrpActions {
    type: typeof SEND.HANDLE_XRP_DESTINATION_TAG_CHANGE;
    destinationTag: string;
}

const FLAGS = 0x80000000;

/*
    Change value in input "destination tag"
 */
const handleDestinationTagChange = (destinationTag: string) => (dispatch: Dispatch) => {
    dispatch({
        type: SEND.HANDLE_XRP_DESTINATION_TAG_CHANGE,
        destinationTag,
    });
};

const sendTransaction = () => async (getState: GetState) => {
    const { account } = getState().wallet.selectedAccount;
    if (!account) return null;

    // @ts-ignore
    const signedTransaction = await TrezorConnect.rippleSignTransaction({
        device: {
            path: selected.path,
            instance: selected.instance,
            state: selected.state,
        },
        useEmptyPassphrase: selected.useEmptyPassphrase,
        path: account.accountPath,
        transaction: {
            fee: currentState.selectedFeeLevel.fee, // Fee must be in the range of 10 to 10,000 drops
            flags: FLAGS,
            sequence: account.sequence,
            payment,
        },
    });

    console.log(signedTransaction);
};

export { handleDestinationTagChange, sendTransaction };
