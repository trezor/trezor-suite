import TrezorConnect from 'trezor-connect';
import BigNumber from 'bignumber.js';
import * as accountActions from '@wallet-actions/accountActions';
import * as notificationActions from '@suite-actions/notificationActions';
import * as modalActions from '@suite-actions/modalActions';
import { SEND } from '@wallet-actions/constants';

import { formatNetworkAmount, getAccountKey } from '@wallet-utils/accountUtils';
import { findValidOutputs } from '@wallet-utils/sendFormUtils';

import { Dispatch, GetState } from '@suite-types';
import { Account } from '@wallet-types';
import { FormState, UseSendFormState, PrecomposedTransactionFinal } from '@wallet-types/sendForm';
import * as sendFormBitcoinActions from './send/sendFormBitcoinActions';
import * as sendFormEthereumActions from './send/sendFormEthereumActions';
import * as sendFormRippleActions from './send/sendFormRippleActions';

export type SendFormActions =
    | {
          type: typeof SEND.STORE_DRAFT;
          key: string;
          formState: FormState;
      }
    | {
          type: typeof SEND.REMOVE_DRAFT;
          key: string;
      }
    | {
          type: typeof SEND.REQUEST_SIGN_TRANSACTION;
          payload?: {
              formValues: FormState;
              transactionInfo: PrecomposedTransactionFinal;
          };
      }
    | {
          type: typeof SEND.REQUEST_PUSH_TRANSACTION;
          payload?: {
              tx: string;
              coin: Account['symbol'];
          };
      };

export const saveDraft = (formState: FormState) => async (
    dispatch: Dispatch,
    getState: GetState,
) => {
    const { selectedAccount } = getState().wallet;
    if (selectedAccount.status !== 'loaded') return null;
    const { account } = selectedAccount;
    const { symbol, descriptor, deviceState } = account;
    const key = getAccountKey(descriptor, symbol, deviceState);

    dispatch({
        type: SEND.STORE_DRAFT,
        key,
        formState,
    });
};

export const getDraft = () => (_dispatch: Dispatch, getState: GetState) => {
    const { selectedAccount, send } = getState().wallet;
    if (selectedAccount.status !== 'loaded') return;
    const { account } = selectedAccount;
    const { symbol, descriptor, deviceState } = account;
    const key = getAccountKey(descriptor, symbol, deviceState);

    return send.drafts[key];
};

export const removeDraft = () => (dispatch: Dispatch, getState: GetState) => {
    const { selectedAccount, send } = getState().wallet;
    if (selectedAccount.status !== 'loaded') return;
    const { account } = selectedAccount;
    const { symbol, descriptor, deviceState } = account;
    const key = getAccountKey(descriptor, symbol, deviceState);

    if (send.drafts[key]) {
        dispatch({
            type: SEND.REMOVE_DRAFT,
            key,
        });
    }
};

export const composeTransaction = (formValues: FormState, formState: UseSendFormState) => async (
    dispatch: Dispatch,
) => {
    const validOutputs = findValidOutputs(formValues);
    if (validOutputs.length === 0) return;

    const values = { ...formValues, outputs: validOutputs };

    const { account } = formState;
    if (account.networkType === 'bitcoin') {
        return dispatch(sendFormBitcoinActions.composeTransaction(values, formState));
    }
    if (account.networkType === 'ethereum') {
        return dispatch(sendFormEthereumActions.composeTransaction(values, formState));
    }
    if (account.networkType === 'ripple') {
        return dispatch(sendFormRippleActions.composeTransaction(values, formState));
    }
};

// this is only a wrapper for `openDeferredModal` since it doesn't work with `bindActionCreators`
// used in send/Address component
export const scanQrRequest = () => (dispatch: Dispatch) => {
    return dispatch(modalActions.openDeferredModal({ type: 'qr-reader' }));
};

// non-redux action
export const checkRippleEmptyAddress = async (descriptor: string, coin: string) => {
    const response = await TrezorConnect.getAccountInfo({
        descriptor,
        coin,
    });

    if (response.success) {
        return response.payload.empty;
    }
    return false;
};

// returned and called automatically after from signTransaction process (called from useSendForm hook)
// Opens a modal with deferred decision
export const requestPushTransaction = (payload: any) => (dispatch: Dispatch) => {
    // set signed transaction in reducer
    dispatch({
        type: SEND.REQUEST_PUSH_TRANSACTION,
        payload,
    });
    // display modal and wait for user response
    return dispatch(modalActions.openDeferredModal({ type: 'review-transaction' }));
};

export const signTransaction = (values: FormState, composedTx: PrecomposedTransactionFinal) => (
    dispatch: Dispatch,
    getState: GetState,
) => {
    const { account } = getState().wallet.selectedAccount;

    if (!account) return;
    if (account.networkType === 'bitcoin') {
        return dispatch(sendFormBitcoinActions.signTransaction(values, composedTx));
    }
    if (account.networkType === 'ethereum') {
        return dispatch(sendFormEthereumActions.signTransaction(values, composedTx));
    }
    if (account.networkType === 'ripple') {
        return dispatch(sendFormRippleActions.signTransaction(values, composedTx));
    }
};

export const cancelSignTx = () => (dispatch: Dispatch, getState: GetState) => {
    const { signedTx } = getState().wallet.send;
    dispatch({ type: SEND.REQUEST_SIGN_TRANSACTION });
    dispatch({ type: SEND.REQUEST_PUSH_TRANSACTION });
    // if transaction is not signed yet interrupt signing in TrezorConnect
    if (!signedTx) {
        TrezorConnect.cancel('tx-cancelled');
        return;
    }
    // otherwise just close modal
    dispatch(modalActions.onCancel());
};

export const pushTransaction = () => async (dispatch: Dispatch, getState: GetState) => {
    const { signedTx, precomposedTx } = getState().wallet.send;
    const { account } = getState().wallet.selectedAccount;
    const { device } = getState().suite;
    if (!signedTx || !precomposedTx || !account) return false;

    const sentTx = await TrezorConnect.pushTransaction(signedTx);
    // const sentTx = { success: true, payload: { txid: 'ABC ' } };

    // close modal regardless result
    dispatch(cancelSignTx());

    const spentWithoutFee = new BigNumber(precomposedTx.totalSpent)
        .minus(precomposedTx.fee)
        .toString();

    if (sentTx.success) {
        dispatch(
            notificationActions.addToast({
                type: 'tx-sent',
                formattedAmount: formatNetworkAmount(spentWithoutFee, account.symbol, true),
                device,
                descriptor: account.descriptor,
                symbol: account.symbol,
                txid: sentTx.payload.txid,
            }),
        );

        dispatch(accountActions.fetchAndUpdateAccount(account));
    } else {
        dispatch(
            notificationActions.addToast({ type: 'sign-tx-error', error: sentTx.payload.error }),
        );
    }

    // resolve sign process
    return sentTx.success;
};

export const dispose = () => async () => {
    // TODO: reset reducer
};
