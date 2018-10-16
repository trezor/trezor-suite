/* @flow */
import TrezorConnect from 'trezor-connect';

import type {
    GetState,
    Dispatch,
} from 'flowtype';

export const sign = (path: Array<number>, message: string, hex: boolean = false): AsyncAction => async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    const selected = getState().wallet.selectedDevice;
    const devicePath = selected.path;

    const device = {
        path: devicePath,
        instance: selected.instance,
        state: selected.state,
    };

    const response = await TrezorConnect
        .ethereumSignMessage({
            device, path, hex, message, useEmptyPassphrase: selected.useEmptyPassphrase,
        });

    console.log(response);
};