import { type Dispatch, type UnknownAction } from '@reduxjs/toolkit';
import { type MiddlewareAPI } from 'redux';

import { PAYMENT_REQUEST_BUTTON_NAMES, selectAccountByKey } from '@suite-common/wallet-core';
import { UI_EVENTS, isUiEventOfType } from '@trezor/connect';
import { bluetoothIpc } from '@trezor/transport-bluetooth';

import { type AppState } from 'src/types/suite';

const SIGN_TX_NETWORK_TYPES = ['cardano', 'ethereum', 'stellar', 'tron'] as const;

const SIGN_TX_ROUTES = [
    'wallet-send',
    'wallet-staking',
    'wallet-index',
    'wallet-trading-exchange-confirm',
    'wallet-trading-sell-confirm',
    'earn-yield-deposit',
    'earn-yield-withdraw',
    'earn-yield-claim',
    // The clear-signed wrap/unwrap review needs these too: firmware announces its provider and
    // intent screens with ButtonRequest_Other (confirm_action's default), which without remapping
    // would replace the review with ConfirmActionModal midway and reset its step tracking.
    'earn-yield-wrap',
    'earn-yield-unwrap',
    'earn-tron-stake',
    'earn-tron-vote',
    'earn-tron-unstake',
    'earn-tron-withdraw',
    'earn-tron-claim',
] as const;

const SIGN_TX_CONNECT_METHODS = [
    'cardanoSignTransaction',
    'ethereumSignTransaction',
    'stellarSignTransaction',
] as const;

const getAccountForButtonRequest = (state: AppState) => {
    const { account } = state.wallet.selectedAccount;
    if (account) return account;

    const yieldAccountKey = state.wallet.stablecoinYield.txReview.accountKey;
    if (yieldAccountKey) return selectAccountByKey(state, yieldAccountKey);

    const tronStakeAccountKey = state.wallet.tronStake.txReview.accountKey;
    if (tronStakeAccountKey) return selectAccountByKey(state, tronStakeAccountKey);

    const sendAccountKey = state.wallet.send.accountKey;
    if (sendAccountKey) return selectAccountByKey(state, sendAccountKey);

    return undefined;
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

    // SLIP-24 payment request review screens. Without remapping they route to ConfirmActionModal
    // instead of the transaction review modal. Detected by name so it works on bitcoin-like networks
    // (absent from SIGN_TX_NETWORK_TYPES) without affecting regular sends.
    if (name !== undefined && PAYMENT_REQUEST_BUTTON_NAMES.includes(name)) {
        return true;
    }

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
    (api: MiddlewareAPI<Dispatch<UnknownAction>, AppState>) =>
    (next: Dispatch<UnknownAction>) =>
    (action: UnknownAction): UnknownAction => {
        if (
            isUiEventOfType(action, UI_EVENTS.FIRMWARE_DISCONNECT) &&
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
        if (isUiEventOfType(action, UI_EVENTS.BUTTON_REQUEST)) {
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
