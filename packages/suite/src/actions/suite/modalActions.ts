import { Action, GetState, Dispatch, TrezorDevice } from '@suite-types/index';
import { MODAL, CONNECT } from '@suite-actions/constants';

export interface ModalActions {
    type: typeof MODAL.CLOSE;
}

const chooseWalletType = (hidden: boolean): Action => (
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

const forgetDevices = (device: TrezorDevice): Action => ({
    type: CONNECT.FORGET,
    device,
});

const forgetDevice = (device: TrezorDevice): Action => ({
    type: CONNECT.FORGET_SINGLE,
    device,
});

const cancel = (): Action => ({
    type: MODAL.CLOSE,
});

export default {
    cancel,
    forgetDevice,
    forgetDevices,
    chooseWalletType,
};
