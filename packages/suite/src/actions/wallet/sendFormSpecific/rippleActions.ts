import TrezorConnect from 'trezor-connect';
import { SEND } from '@wallet-actions/constants';
import { NOTIFICATION } from '@suite-actions/constants';
import { Dispatch, GetState } from '@suite-types';

export interface SendFormRippleActions {
    type: typeof SEND.XRP_HANDLE_DESTINATION_TAG_CHANGE;
    destinationTag: string;
}

/*
    Compose transaction
 */
export const compose = () => async (dispatch: Dispatch) => {
    console.log('compose ripple');
    dispatch({ type: SEND.COMPOSE_PROGRESS, isComposing: false });
};

/*
    Change value in input "destination tag"
 */
export const handleDestinationTagChange = (destinationTag: string) => (dispatch: Dispatch) => {
    dispatch({
        type: SEND.XRP_HANDLE_DESTINATION_TAG_CHANGE,
        destinationTag,
    });
};

/*
    Send transaction
 */
export const send = () => async (dispatch: Dispatch, getState: GetState) => {
    const { send, selectedAccount } = getState().wallet;
    if (!send) return;
    const FLAGS = 0x80000000;
    const { account } = selectedAccount;
    // Fee must be in the range of 10 to 10,000 drops
    const { selectedFee, outputs, networkTypeRipple } = send;
    const { destinationTag } = networkTypeRipple;
    const selectedDevice = getState().suite.device;
    if (!account || account.networkType !== 'ripple' || !selectedDevice || !destinationTag)
        return null;

    // @ts-ignore
    const signedTransaction = await TrezorConnect.rippleSignTransaction({
        device: {
            path: selectedDevice.path,
            instance: selectedDevice.instance,
            state: selectedDevice.state,
        },
        useEmptyPassphrase: selectedDevice.useEmptyPassphrase,
        path: account.path,
        transaction: {
            fee: selectedFee.feePerUnit,
            flags: FLAGS,
            sequence: account.misc.sequence,
            payment: {
                address: outputs[0].address.value,
                destinationTg: parseInt(destinationTag.value || '0', 10),
                amount: outputs[0].amount.value,
            },
        },
    });

    if (!signedTransaction || !signedTransaction.success) {
        dispatch({
            type: NOTIFICATION.ADD,
            payload: {
                variant: 'error',
                title: 'aaaaa', // TODO
                message: signedTransaction.payload.error,
                cancelable: true,
                actions: [],
            },
        });
        return;
    }

    const push = await TrezorConnect.pushTransaction({
        tx: signedTransaction.payload.serializedTx,
        coin: 'xrp',
    });

    if (!push.success) {
        dispatch({
            type: NOTIFICATION.ADD,
            payload: {
                variant: 'error',
                title: 'bbbb', // TODO
                message: push.payload.error,
                cancelable: true,
                actions: [],
            },
        });
    }
};
