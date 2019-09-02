import TrezorConnect, { ApplySettingsParams, ChangePinParams } from 'trezor-connect';

export const applySettings = (params: ApplySettingsParams) => async () => {
    await TrezorConnect.applySettings(params);
};

export const changePin = (params: ChangePinParams) => async () => {
    await TrezorConnect.changePin(params);
};
