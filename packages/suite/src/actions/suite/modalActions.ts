import { Action, TrezorDevice } from '@suite-types/index';
import { MODAL, CONNECT } from '@suite-actions/constants';

export interface ModalActions {
    type: typeof MODAL.CLOSE;
}

const onForgetDevice = (device: TrezorDevice): Action => ({
    // @ts-ignore
    type: CONNECT.FORGET,
    device,
});

const onForgetDeviceSingle = (device: TrezorDevice): Action => ({
    // @ts-ignore
    type: CONNECT.FORGET_SINGLE,
    device,
});

const onCancel = (): Action => ({
    type: MODAL.CLOSE,
});

export default {
    onCancel,
    onForgetDevice,
    onForgetDeviceSingle,
};
