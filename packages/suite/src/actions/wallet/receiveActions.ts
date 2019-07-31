import { FormattedMessage } from 'react-intl';
import TrezorConnect from 'trezor-connect';
import { GetState, Dispatch, TrezorDevice } from '@suite-types/index';
import { Actions } from '@wallet-types/index';
import { RECEIVE, NOTIFICATION } from '@wallet-actions/constants';

import l10nMessages from '@wallet-components/Notifications/actions.messages';
import l10nCommonMessages from '@wallet-views/messages';

export type ReceiveActions =
    | { type: typeof RECEIVE.INIT; state: State }
    | { type: typeof RECEIVE.DISPOSE }
    | { type: typeof RECEIVE.REQUEST_UNVERIFIED; device: TrezorDevice }
    | { type: typeof RECEIVE.SHOW_ADDRESS }
    | { type: typeof RECEIVE.HIDE_ADDRESS }
    | { type: typeof RECEIVE.SHOW_UNVERIFIED_ADDRESS };

export const init = (): ThunkAction => (dispatch: Dispatch): void => {
    const state: State = {
        ...initialState,
    };

    dispatch({
        type: RECEIVE.INIT,
        state,
    });
};

export const dispose = (): Actions => ({
    type: RECEIVE.DISPOSE,
});

export const showUnverifiedAddress = (): Actions => ({
    type: RECEIVE.SHOW_UNVERIFIED_ADDRESS,
});

//export const showAddress = (address_n: string): AsyncAction => {
export const showAddress = (path: Array<number>): AsyncAction => async (
    dispatch: Dispatch,
    getState: GetState,
): Promise<void> => {
    const selected = getState().wallet.selectedDevice;
    const { network } = getState().selectedAccount;

    if (!selected || !network) return;

    if (selected && (!selected.connected || !selected.available)) {
        dispatch({
            type: RECEIVE.REQUEST_UNVERIFIED,
            device: selected,
        });
        return;
    }

    const params = {
        device: {
            path: selected.path,
            instance: selected.instance,
            state: selected.state,
        },
        path,
        useEmptyPassphrase: selected.useEmptyPassphrase,
    };

    let response;
    switch (network.type) {
        case 'ethereum':
            response = await TrezorConnect.ethereumGetAddress(params);
            break;
        case 'ripple':
            response = await TrezorConnect.rippleGetAddress(params);
            break;
        default:
            response = {
                payload: {
                    error: `ReceiveActions.showAddress: Unknown network type: ${network.type}`,
                },
            };
            break;
    }

    if (response.success) {
        dispatch({
            type: RECEIVE.SHOW_ADDRESS,
        });
    } else {
        dispatch({
            type: RECEIVE.HIDE_ADDRESS,
        });

        // special case: device no-backup permissions not granted
        // $FlowIssue: remove this after trezor-connect@7.0.0 release
        if (response.payload.code === 403) return;

        dispatch({
            type: NOTIFICATION.ADD,
            payload: {
                variant: 'error',
                title: <FormattedMessage {...l10nMessages.TR_VERIFYING_ADDRESS_ERROR} />,
                message: response.payload.error,
                cancelable: true,
                actions: [
                    {
                        label: <FormattedMessage {...l10nCommonMessages.TR_TRY_AGAIN} />,
                        callback: () => {
                            dispatch(showAddress(path));
                        },
                    },
                ],
            },
        });
    }
};

export default {
    init,
    dispose,
    showAddress,
    showUnverifiedAddress,
};
