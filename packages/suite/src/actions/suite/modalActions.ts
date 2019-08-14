import { MODAL, CONNECT } from '@suite-actions/constants';
import { Action, TrezorDevice } from '@suite-types';

export interface ModalActions {
    type: typeof MODAL.CLOSE;
}

export const onForgetDevice = (device: TrezorDevice): Action => ({
    // @ts-ignore
    type: CONNECT.FORGET,
    device,
});

export const onForgetDeviceSingle = (device: TrezorDevice): Action => ({
    // @ts-ignore
    type: CONNECT.FORGET_SINGLE,
    device,
});

export const onCancel = (): Action => ({
    type: MODAL.CLOSE,
});

// TODO: this method is only a placeholder
export const onRememberDevice = (): Action => ({
    type: MODAL.CLOSE,
});
