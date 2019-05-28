import { Dispatch, GetState } from '@suite/types';
import * as BLOCKCHAIN from './constants/blockchain';

// Conditionally subscribe to blockchain backend
// called after TrezorConnect.init successfully emits TRANSPORT.START event
// checks if there are discovery processes loaded from LocalStorage
// if so starts subscription to proper networks

export type BlockchainActions = {
    type: typeof BLOCKCHAIN.READY;
}

export const init = () => async (
    dispatch: Dispatch,
    getState: GetState
): Promise<void> => {
    // TODO: add connections to backend (from wallet)

    // continue wallet initialization
    dispatch({
        type: BLOCKCHAIN.READY,
    });
};