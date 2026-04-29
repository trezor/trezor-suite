import { type MiddlewareAPI } from 'redux';

import { selectAccountByKey } from '@suite-common/wallet-core';
import { UI_REQUEST } from '@trezor/connect';
import { bluetoothIpc } from '@trezor/transport-bluetooth';

import { type Action, type AppState, type Dispatch } from 'src/types/suite';

const SIGN_TX_NETWORK_TYPES = ['cardano', 'ethereum', 'stellar', 'tron'] as const;

const SIGN_TX_ROUTES = [
    'wallet-send',
    'wallet-staking',
    'wallet-index',
    'wallet-trading-exchange-confirm',
    'wallet-trading-sell-confirm',
    'earn-supply',
    'earn-withdraw',
] as const;

const SIGN_TX_CONNECT_METHODS = [
    'cardanoSignTransaction',
    'ethereumSignTransaction',
    'stellarSignTransaction',
] as const;

const getAccountForButtonRequest = (state: AppState) => {
    const { account } = state.wallet.selectedAccount;
    if (account) return account;

    const { accountKey } = state.wallet.stablecoinYield.txReview;

    return selectAccountByKey(state, accountKey);
};

const shouldRemapToSignTx = (
    code: string | undefined,
    name: string | undefined,
    state: AppState,
): boolean => {
    if (
        name === 'confirm_ethereum_approve' &&
        (code === 'ButtonRequest_Other' || code === 'ButtonRequest_Warning')
    ) {
        return true;
    }

    if (code !== 'ButtonRequest_Other') return false;

    const account = getAccountForButtonRequest(state);
    const { activeCall } = state.connectPopup;

    const isInSuite =
        SIGN_TX_NETWORK_TYPES.some(type => type === account?.networkType) &&
        SIGN_TX_ROUTES.some(route => route === state.router.route?.name);

    const isInConnectCall =
        activeCall?.state === 'ongoing' &&
        SIGN_TX_CONNECT_METHODS.some(method => method === activeCall.method);

    return isInSuite || isInConnectCall;
};

const buttonRequest =
    (api: MiddlewareAPI<Dispatch, AppState>) =>
    (next: Dispatch) =>
    (action: Action): Action => {
        if (
            action.type === UI_REQUEST.FIRMWARE_DISCONNECT &&
            action.payload.device.descriptor.apiType === 'bluetooth' &&
            action.payload.device.descriptor.id
        ) {
            const { id } = action.payload.device.descriptor;
            bluetoothIpc
                .disconnectDevice(id)
                .then(() => bluetoothIpc.startScan()) // restart scanning
                .catch(() => {});
        }

        // firmware bug https://github.com/trezor/trezor-firmware/issues/35
        // ugly hack to make Cardano review modal work
        // ugly hack to make Ethereum staking and bump fee review modal on specific devices work
        // root cause of this bug is wrong button request ButtonRequest_Other from CardanoSignTx - should be ButtonRequest_SignTx
        if (action.type === UI_REQUEST.REQUEST_BUTTON) {
            if (shouldRemapToSignTx(action.payload.code, action.payload.name, api.getState())) {
                api.dispatch({
                    ...action,
                    payload: { ...action.payload, code: 'ButtonRequest_SignTx' },
                });

                return action;
            }

            if (action.payload.code === 'ButtonRequest_Address') {
                const { activeCall } = api.getState().connectPopup;
                // Skip if address confirmation modal open
                if (activeCall?.state === 'address-confirmation') {
                    return action;
                }
            }
        }

        return next(action);
    };
export default buttonRequest;
