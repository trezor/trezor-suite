import TrezorConnect, { ApplySettingsParams, ChangePinParams } from 'trezor-connect';
import { Dispatch, GetState } from '@suite-types';

//  TODO: should be reworked to deviceManagementActions

export const applySettings = (params: ApplySettingsParams) => async (
    _dispatch: Dispatch,
    getState: GetState,
) => {
    const { device } = getState().suite;
    await TrezorConnect.applySettings({
        device,
        ...params,
    });
};

export const changePin = (params: ChangePinParams) => async (
    _dispatch: Dispatch,
    getState: GetState,
) => {
    const { device } = getState().suite;
    await TrezorConnect.changePin({
        device,
        ...params,
    });
};
