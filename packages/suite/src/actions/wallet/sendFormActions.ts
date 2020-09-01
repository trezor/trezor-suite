import TrezorConnect from 'trezor-connect';
import BigNumber from 'bignumber.js';
import * as accountActions from '@wallet-actions/accountActions';
import * as notificationActions from '@suite-actions/notificationActions';
import * as modalActions from '@suite-actions/modalActions';
import { SEND } from '@wallet-actions/constants';

import { formatAmount, formatNetworkAmount } from '@wallet-utils/accountUtils';
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
      }
    | {
          type: typeof SEND.SEND_RAW;
          payload?: boolean;
      }
    | {
          type: typeof SEND.DISPOSE;
      };

export const saveDraft = (formState: FormState) => async (
    dispatch: Dispatch,
    getState: GetState,
) => {
    const { selectedAccount } = getState().wallet;
    if (selectedAccount.status !== 'loaded') return null;

    dispatch({
        type: SEND.STORE_DRAFT,
        key: selectedAccount.account.key,
        formState,
    });
};

export const getDraft = () => (_dispatch: Dispatch, getState: GetState) => {
    const { selectedAccount, send } = getState().wallet;
    if (selectedAccount.status !== 'loaded') return;

    return send.drafts[selectedAccount.account.key];
};

export const removeDraft = () => (dispatch: Dispatch, getState: GetState) => {
    const { selectedAccount, send } = getState().wallet;
    if (selectedAccount.status !== 'loaded') return;
    const { key } = selectedAccount.account;

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

    // TEMP: move this to eth & xrp actions (like getBitcoinComposeOutputs util)
    const values = { ...formValues, outputs: validOutputs };

    const { account } = formState;
    if (account.networkType === 'bitcoin') {
        return dispatch(sendFormBitcoinActions.composeTransaction(formValues, formState));
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

// this is only a wrapper for `openDeferredModal` since it doesn't work with `bindActionCreators`
// used in send/Header component
export const importRequest = () => (dispatch: Dispatch) => {
    return dispatch(modalActions.openDeferredModal({ type: 'import-transaction' }));
};

// this could be called at any time during signTransaction or pushTransaction process (from ReviewTransaction modal)
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

// private, called from signTransaction only
const pushTransaction = () => async (dispatch: Dispatch, getState: GetState) => {
    const { signedTx, precomposedTx } = getState().wallet.send;
    const { account } = getState().wallet.selectedAccount;
    const { device } = getState().suite;
    if (!signedTx || !precomposedTx || !account) return false;

    const sentTx = await TrezorConnect.pushTransaction(signedTx);
    // const sentTx = { success: true, payload: { txid: 'ABC ' } };

    // close modal regardless result
    dispatch(cancelSignTx());

    const { token } = precomposedTx;
    const spentWithoutFee = !token
        ? new BigNumber(precomposedTx.totalSpent).minus(precomposedTx.fee).toString()
        : '0';
    // get total amount without fee OR token amount
    const formattedAmount = token
        ? `${formatAmount(
              precomposedTx.transaction.outputs[0].amount,
              token.decimals,
          )} ${token.symbol!.toUpperCase()}`
        : formatNetworkAmount(spentWithoutFee, account.symbol, true);

    if (sentTx.success) {
        dispatch(
            notificationActions.addToast({
                type: 'tx-sent',
                formattedAmount,
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

export const signTransaction = (
    formValues: FormState,
    transactionInfo: PrecomposedTransactionFinal,
) => async (dispatch: Dispatch, getState: GetState) => {
    const { account } = getState().wallet.selectedAccount;

    if (!account) return;

    // store formValues and transactionInfo in send reducer to be used by ReviewTransaction modal
    dispatch({
        type: SEND.REQUEST_SIGN_TRANSACTION,
        payload: {
            formValues,
            transactionInfo,
        },
    });

    // signTransaction by Trezor
    let serializedTx: string | undefined;
    if (account.networkType === 'bitcoin') {
        serializedTx = await dispatch(
            sendFormBitcoinActions.signTransaction(formValues, transactionInfo),
        );
    }
    if (account.networkType === 'ethereum') {
        serializedTx = await dispatch(
            sendFormEthereumActions.signTransaction(formValues, transactionInfo),
        );
    }
    if (account.networkType === 'ripple') {
        serializedTx = await dispatch(
            sendFormRippleActions.signTransaction(formValues, transactionInfo),
        );
    }

    if (!serializedTx) return;

    // store serializedTx in reducer (TrezorConnect.pushTransaction params) to be used in ReviewTransaction modal and pushTransaction method
    dispatch({
        type: SEND.REQUEST_PUSH_TRANSACTION,
        payload: {
            tx: serializedTx,
            coin: account.symbol,
        },
    });

    // Open a deferred modal and get the decision
    const decision = await dispatch(modalActions.openDeferredModal({ type: 'review-transaction' }));
    if (decision) {
        // push tx to the network
        return dispatch(pushTransaction());
    }
};

export const sendRaw = (payload?: boolean) => ({
    type: SEND.SEND_RAW,
    payload,
});

export const pushRawTransaction = (tx: string) => async (
    dispatch: Dispatch,
    getState: GetState,
) => {
    const { account } = getState().wallet.selectedAccount;
    if (!account) return false;

    const sentTx = await TrezorConnect.pushTransaction({
        tx,
        coin: account.symbol,
    });

    if (sentTx.success) {
        dispatch(
            notificationActions.addToast({
                type: 'raw-tx-sent',
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

export const dispose = () => ({
    type: SEND.DISPOSE,
});
