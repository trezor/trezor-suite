import TrezorConnect from 'trezor-connect';
import { Action } from '@wallet-types/index';
import { RECEIVE } from '@wallet-actions/constants';
import { NOTIFICATION, MODAL } from '@suite-actions/constants';
import l10nMessages from '@wallet-components/Notifications/actions.messages';
import l10nCommonMessages from '@wallet-views/messages';
import { GetState, Dispatch, TrezorDevice } from '@suite-types';

export type ReceiveActions =
    | { type: typeof RECEIVE.INIT; descriptor: string }
    | { type: typeof RECEIVE.DISPOSE }
    | { type: typeof RECEIVE.REQUEST_UNVERIFIED; device: TrezorDevice; addressPath: string }
    | { type: typeof RECEIVE.SHOW_ADDRESS; descriptor: string }
    | { type: typeof RECEIVE.HIDE_ADDRESS; descriptor: string }
    | { type: typeof RECEIVE.SHOW_UNVERIFIED_ADDRESS; descriptor: string };

export const dispose = (): Action => ({
    type: RECEIVE.DISPOSE,
});

export const showUnverifiedAddress = (path: string): Action => {
    return {
        type: RECEIVE.SHOW_UNVERIFIED_ADDRESS,
        descriptor: path,
    };
};

export const showAddress = (path: string) => async (
    dispatch: Dispatch,
    getState: GetState,
): Promise<void> => {
    const selectedDevice = getState().suite.device;
    const { network } = getState().wallet.selectedAccount;

    if (!selectedDevice || !network) return;

    if (selectedDevice && (!selectedDevice.connected || !selectedDevice.available)) {
        // Show modal when device is not connected
        dispatch({
            type: RECEIVE.REQUEST_UNVERIFIED,
            device: selectedDevice,
            addressPath: path,
        });
        return;
    }

    // mark address that is being verified
    dispatch({
        type: RECEIVE.INIT,
        descriptor: path,
    });

    // overlay
    dispatch({
        type: MODAL.OVERLAY_ONLY,
    });

    const params = {
        device: {
            path: selectedDevice.path,
            instance: selectedDevice.instance,
            state: selectedDevice.state,
        },
        path,
        useEmptyPassphrase: selectedDevice.useEmptyPassphrase,
    };

    let response;
    switch (network.networkType) {
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
                    error: `ReceiveActions.showAddress: Unknown network type: ${network.networkType}`,
                },
            };
            break;
    }

    if (response.success) {
        dispatch({
            type: RECEIVE.SHOW_ADDRESS,
            descriptor: path,
        });
    } else {
        dispatch({
            type: RECEIVE.HIDE_ADDRESS,
            descriptor: path,
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
    dispatch({
        type: MODAL.CLOSE,
    });
};
