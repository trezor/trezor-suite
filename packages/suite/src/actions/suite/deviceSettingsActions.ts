import TrezorConnect, { ApplySettingsParams, ChangePinParams } from 'trezor-connect';
import { lockUI } from '@suite-actions/suiteActions';
import { Dispatch } from '@suite-types';

export const applySettings = (params: ApplySettingsParams) => async (dispatch: Dispatch) => {
    dispatch(lockUI(true));
    await TrezorConnect.applySettings(params);
    dispatch(lockUI(false));
};

export const changePin = (params: ChangePinParams) => async (dispatch: Dispatch) => {
    dispatch(lockUI(true));
    TrezorConnect.changePin(params);
    dispatch(lockUI(false));
};
