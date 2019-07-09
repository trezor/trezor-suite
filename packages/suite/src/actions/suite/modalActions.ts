import { Action, GetState, Dispatch } from '@suite-types/index';
import { MODAL, CONNECT } from '@suite-actions/constants';

export type ModalActions = { type: typeof MODAL.CLOSE };

export const onWalletTypeRequest = (hidden: boolean): Action => (
    dispatch: Dispatch,
    getState: GetState,
): void => {
    const { modal } = getState();
    if (modal.context !== MODAL.CONTEXT_DEVICE) return;
    dispatch({
        type: MODAL.CLOSE,
    });
    dispatch({
        type: CONNECT.RECEIVE_WALLET_TYPE,
        device: modal.device,
        hidden,
    });
};

export default {
    onWalletTypeRequest,
};
