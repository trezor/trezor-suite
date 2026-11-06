import { type Dispatch, type UnknownAction } from '@reduxjs/toolkit';
import { type MiddlewareAPI } from 'redux';

import { type SelectedAccountRootState, selectSelectedAccount } from '@suite/account';
import { type RouterRootState, selectRouteName } from '@suite/router';
import {
    type ConnectPopupStateRootState,
    selectConnectPopupCall,
} from '@suite-common/connect-popup';
import {
    type AccountsRootState,
    PAYMENT_REQUEST_BUTTON_NAMES,
    type SendRootState,
    type TronStakeRootState,
    type YieldRootState,
    selectAccountByKey,
    selectSendFormAccountKey,
} from '@suite-common/wallet-core';
import { type DeviceButtonRequestCode, UI_EVENTS, isUiEventOfType } from '@trezor/connect';

type ButtonRequestMiddlewareState = SelectedAccountRootState &
    RouterRootState &
    ConnectPopupStateRootState &
    AccountsRootState &
    SendRootState &
    YieldRootState &
    TronStakeRootState;

const SIGN_TX_NETWORK_TYPES = ['cardano', 'ethereum', 'stellar', 'tron'] as const;

const SIGN_TX_ROUTES = [
    'wallet-send',
    'wallet-staking',
    'wallet-index',
    'wallet-trading-exchange-confirm',
    'wallet-trading-exchange-approval',
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

const getAccountForButtonRequest = (state: ButtonRequestMiddlewareState) => {
    const account = selectSelectedAccount(state);
    if (account) return account;

    const yieldAccountKey = state.wallet.stablecoinYield.txReview.accountKey;
    if (yieldAccountKey) return selectAccountByKey(state, yieldAccountKey);

    const tronStakeAccountKey = state.wallet.tronStake.txReview.accountKey;
    if (tronStakeAccountKey) return selectAccountByKey(state, tronStakeAccountKey);

    const sendAccountKey = selectSendFormAccountKey(state);
    if (sendAccountKey) return selectAccountByKey(state, sendAccountKey);

    return undefined;
};

const shouldRemapToSignTx = (
    code: DeviceButtonRequestCode,
    name: string | undefined,
    state: ButtonRequestMiddlewareState,
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
    const activeCall = selectConnectPopupCall(state);

    const isInSuite =
        SIGN_TX_NETWORK_TYPES.some(type => type === account?.networkType) &&
        SIGN_TX_ROUTES.some(route => route === selectRouteName(state));

    const isInConnectCall =
        activeCall?.state === 'ongoing' &&
        SIGN_TX_CONNECT_METHODS.some(method => method === activeCall.method);

    return isInSuite || isInConnectCall;
};

const buttonRequest =
    (api: MiddlewareAPI<Dispatch<UnknownAction>, ButtonRequestMiddlewareState>) =>
    (next: Dispatch<UnknownAction>) =>
    (action: UnknownAction): UnknownAction => {
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
                const activeCall = selectConnectPopupCall(api.getState());
                // Skip if address confirmation modal open
                if (activeCall?.state === 'address-confirmation') {
                    return action;
                }
            }
        }

        return next(action);
    };
export default buttonRequest;
