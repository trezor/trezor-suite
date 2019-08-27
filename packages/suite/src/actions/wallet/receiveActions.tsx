import TrezorConnect from 'trezor-connect';
import { Action } from '@wallet-types/index';
import { RECEIVE, NOTIFICATION } from '@wallet-actions/constants';

import { initialState, State } from '@wallet-reducers/receiveReducer';
import l10nMessages from '@wallet-components/Notifications/actions.messages';
import l10nCommonMessages from '@wallet-views/messages';
import { GetState, Dispatch, TrezorDevice } from '@suite-types';
import { FormattedMessage } from 'react-intl';

export type ReceiveActions =
    | { type: typeof RECEIVE.INIT; state: State }
    | { type: typeof RECEIVE.DISPOSE }
    | { type: typeof RECEIVE.REQUEST_UNVERIFIED; device: TrezorDevice }
    | { type: typeof RECEIVE.SHOW_ADDRESS }
    | { type: typeof RECEIVE.HIDE_ADDRESS }
    | { type: typeof RECEIVE.SHOW_UNVERIFIED_ADDRESS };

export const init = () => (dispatch: Dispatch) => {
    const state: State = {
        ...initialState,
    };

    dispatch({
        type: RECEIVE.INIT,
        state,
    });
};

export const dispose = (): Action => ({
    type: RECEIVE.DISPOSE,
});

export const showUnverifiedAddress = (): Action => ({
    type: RECEIVE.SHOW_UNVERIFIED_ADDRESS,
});

export const showAddress = (path: string) => async (
    dispatch: Dispatch,
    getState: GetState,
): Promise<void> => {
    const selected = getState().suite.device;
    const { network } = getState().wallet.selectedAccount;

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
            // @ts-ignore
            response = await TrezorConnect.ethereumGetAddress(params);
            break;
        case 'ripple':
            // @ts-ignore
            response = await TrezorConnect.rippleGetAddress(params);
            break;
        case 'bitcoin':
            response = await TrezorConnect.getAddress(params);
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
                title: l10nMessages.TR_VERIFYING_ADDRESS_ERROR.defaultMessage, // TODO intl support for Notification without the need to pass FormattedMessage
                message: response.payload.error,
                cancelable: true,
                actions: [
                    {
                        label: l10nCommonMessages.TR_TRY_AGAIN.defaultMessage,
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
