import { Output } from '@wallet-types/sendForm';
import { SEND } from '@wallet-actions/constants';
import { DEFAULT_LOCAL_CURRENCY } from '@wallet-constants/sendForm';
import { Dispatch, GetState } from '@suite-types';

export type SendFormBitcoinActions =
    | { type: typeof SEND.BTC_ADD_RECIPIENT; newOutput: Output }
    | { type: typeof SEND.BTC_REMOVE_RECIPIENT; outputId: number };

/**
 *    Creates new output (address, amount, fiatValue, localCurrency)
 */
export const addRecipient = () => (dispatch: Dispatch, getState: GetState) => {
    const { send } = getState().wallet;
    if (!send) return null;

    const { outputs } = send;
    const outputsCount = outputs.length;
    const lastOutput = outputs[outputsCount - 1];
    const lastOutputId = lastOutput.id;

    const newOutput = {
        id: lastOutputId + 1,
        address: { value: null, error: null },
        amount: { value: null, error: null },
        fiatValue: { value: null },
        localCurrency: { value: DEFAULT_LOCAL_CURRENCY }, // TODO add from settings
    };

    dispatch({
        type: SEND.BTC_ADD_RECIPIENT,
        newOutput,
    });
};

/**
 *    Removes added output (address, amount, fiatValue, localCurrency)
 */
export const removeRecipient = (outputId: number) => (dispatch: Dispatch) => {
    dispatch({ type: SEND.BTC_REMOVE_RECIPIENT, outputId });
};

export const send = () => async () => {
    console.log('send');
};
