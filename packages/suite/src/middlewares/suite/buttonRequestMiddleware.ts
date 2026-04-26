import { type MiddlewareAPI } from 'redux';

import { UI_REQUEST } from '@trezor/connect';
import { bluetoothIpc } from '@trezor/transport-bluetooth';

import { type Action, type AppState, type Dispatch } from 'src/types/suite';

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
        if (
            action.type === UI_REQUEST.REQUEST_BUTTON &&
            action.payload.code === 'ButtonRequest_Other'
        ) {
            const {
                wallet: {
                    selectedAccount: { account },
                },
                connectPopup: { activeCall },
                router: { route },
            } = api.getState();
            const isInSuite =
                ['cardano', 'ethereum', 'stellar', 'tron'].includes(account?.networkType || '') &&
                [
                    'wallet-send',
                    'wallet-staking',
                    'wallet-index',
                    'wallet-trading-exchange-confirm',
                    'wallet-trading-sell-confirm',
                    'earn-supply',
                    'earn-withdraw',
                ].includes(route?.name || '');
            const isInConnectCall =
                activeCall?.state === 'ongoing' &&
                [
                    'cardanoSignTransaction',
                    'ethereumSignTransaction',
                    'stellarSignTransaction',
                ].includes(activeCall.method);
            if (isInSuite || isInConnectCall) {
                api.dispatch({
                    ...action,
                    payload: { ...action.payload, code: 'ButtonRequest_SignTx' },
                });

                return action;
            }
        }
        if (
            action.type === UI_REQUEST.REQUEST_BUTTON &&
            action.payload.name === 'confirm_ethereum_approve' &&
            (action.payload.code === 'ButtonRequest_Other' ||
                action.payload.code === 'ButtonRequest_Warning')
        ) {
            api.dispatch({
                ...action,
                payload: { ...action.payload, code: 'ButtonRequest_SignTx' },
            });

            return action;
        }

        if (
            action.type === UI_REQUEST.REQUEST_BUTTON &&
            action.payload.code === 'ButtonRequest_Address'
        ) {
            const {
                connectPopup: { activeCall },
            } = api.getState();
            // Skip if address confirmation modal open
            if (activeCall?.state === 'address-confirmation') {
                return action;
            }
        }

        return next(action);
    };
export default buttonRequest;
