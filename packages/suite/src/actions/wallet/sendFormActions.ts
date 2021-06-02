import TrezorConnect from 'trezor-connect';
import BigNumber from 'bignumber.js';
import * as accountActions from '@wallet-actions/accountActions';
import * as transactionActions from '@wallet-actions/transactionActions';
import * as suiteActions from '@suite-actions/suiteActions';
import * as notificationActions from '@suite-actions/notificationActions';
import * as modalActions from '@suite-actions/modalActions';
import { SEND } from '@wallet-actions/constants';

import { formatAmount, formatNetworkAmount, getPendingAccount } from '@wallet-utils/accountUtils';

import { Dispatch, GetState } from '@suite-types';
import { Account } from '@wallet-types';
import { FormState, UseSendFormState, PrecomposedTransactionFinal } from '@wallet-types/sendForm';
import * as sendFormBitcoinActions from './send/sendFormBitcoinActions';
import * as sendFormEthereumActions from './send/sendFormEthereumActions';
import * as sendFormRippleActions from './send/sendFormRippleActions';

export type SendFormAction =
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

export const saveDraft = (formState: FormState) => (dispatch: Dispatch, getState: GetState) => {
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

    const draft = send.drafts[selectedAccount.account.key];
    if (draft) {
        // draft is a read-only redux object. make a copy to be able to modify values
        return JSON.parse(JSON.stringify(draft));
    }
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

export const composeTransaction = (formValues: FormState, formState: UseSendFormState) => (
    dispatch: Dispatch,
) => {
    const { account } = formState;
    if (account.networkType === 'bitcoin') {
        return dispatch(sendFormBitcoinActions.composeTransaction(formValues, formState));
    }
    if (account.networkType === 'ethereum') {
        return dispatch(sendFormEthereumActions.composeTransaction(formValues, formState));
    }
    if (account.networkType === 'ripple') {
        return dispatch(sendFormRippleActions.composeTransaction(formValues, formState));
    }
};

// this is only a wrapper for `openDeferredModal` since it doesn't work with `bindActionCreators`
// used in send/Address component
export const scanQrRequest = () => (dispatch: Dispatch) =>
    dispatch(modalActions.openDeferredModal({ type: 'qr-reader' }));

// this is only a wrapper for `openDeferredModal` since it doesn't work with `bindActionCreators`
// used in send/Header component
export const importRequest = () => (dispatch: Dispatch) =>
    dispatch(modalActions.openDeferredModal({ type: 'import-transaction' }));

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
    if (!signedTx || !precomposedTx || !account) return;

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
        ? `${formatAmount(precomposedTx.totalSpent, token.decimals)} ${token.symbol!.toUpperCase()}`
        : formatNetworkAmount(spentWithoutFee, account.symbol, true);

    if (sentTx.success) {
        const { txid } = sentTx.payload;
        dispatch(
            notificationActions.addToast({
                type: 'tx-sent',
                formattedAmount,
                device,
                descriptor: account.descriptor,
                symbol: account.symbol,
                txid,
            }),
        );

        if (account.networkType === 'bitcoin') {
            // notification from the backend may be delayed.
            // temporary calculate pending balance and utxo until the real account update occurs
            // this will prevent from double spending already used utxo
            if (precomposedTx.prevTxid) {
                dispatch(
                    transactionActions.replaceTransaction(
                        account,
                        precomposedTx,
                        precomposedTx.prevTxid,
                        txid,
                        precomposedTx.rbf,
                    ),
                );
            } else {
                const pendingAccount = getPendingAccount(account, precomposedTx, txid);
                if (pendingAccount) {
                    // update account
                    dispatch(accountActions.updateAccount(pendingAccount));
                }
            }
        } else {
            dispatch(accountActions.fetchAndUpdateAccount(account));
        }
    } else {
        dispatch(
            notificationActions.addToast({ type: 'sign-tx-error', error: sentTx.payload.error }),
        );
    }

    // resolve sign process
    return sentTx;
};

export const signTransaction = (
    formValues: FormState,
    transactionInfo: PrecomposedTransactionFinal,
) => async (dispatch: Dispatch, getState: GetState) => {
    const { device } = getState().suite;
    const { account } = getState().wallet.selectedAccount;

    if (!device || !account) return;

    // native RBF is available since FW 1.9.4/2.3.5
    const nativeRbfAvailable =
        account.networkType === 'bitcoin' &&
        formValues.rbfParams &&
        !device.unavailableCapabilities?.replaceTransaction;
    // decrease output is available since FW 1.10.0/2.4.0
    const decreaseOutputAvailable =
        account.networkType === 'bitcoin' &&
        formValues.rbfParams &&
        !device.unavailableCapabilities?.decreaseOutput;
    const hasDecreasedOutput =
        formValues.rbfParams && typeof formValues.setMaxOutputId === 'number';
    // in case where native RBF is NOT available fallback to "legacy" way of signing (regular signing):
    // - do not enhance inputs/outputs in signFormBitcoinActions
    // - do not display "rbf mode" in ReviewTransaction modal
    const useNativeRbf =
        (!hasDecreasedOutput && nativeRbfAvailable) ||
        (hasDecreasedOutput && decreaseOutputAvailable);

    const enhancedTxInfo = {
        ...transactionInfo,
        rbf: formValues.options.includes('bitcoinRBF'),
        prevTxid: formValues.rbfParams ? formValues.rbfParams.txid : undefined,
        useNativeRbf,
    };

    // store formValues and transactionInfo in send reducer to be used by ReviewTransaction modal
    dispatch({
        type: SEND.REQUEST_SIGN_TRANSACTION,
        payload: {
            formValues,
            transactionInfo: enhancedTxInfo,
        },
    });

    // ReviewTransaction modal has 2 steps: signing and pushing
    // TrezorConnect emits UI.CLOSE_UI.WINDOW after the signing process
    // this action is blocked by actionBlockerMiddleware
    dispatch(suiteActions.setProcessMode(device, 'sign-tx'));

    // signTransaction by Trezor
    let serializedTx: string | undefined;
    if (account.networkType === 'bitcoin') {
        serializedTx = await dispatch(
            sendFormBitcoinActions.signTransaction(formValues, enhancedTxInfo),
        );
    }
    if (account.networkType === 'ethereum') {
        serializedTx = await dispatch(
            sendFormEthereumActions.signTransaction(formValues, enhancedTxInfo),
        );
    }
    if (account.networkType === 'ripple') {
        serializedTx = await dispatch(
            sendFormRippleActions.signTransaction(formValues, enhancedTxInfo),
        );
    }

    dispatch(suiteActions.setProcessMode(device, undefined));

    if (!serializedTx) {
        // close modal manually since UI.CLOSE_UI.WINDOW was blocked
        dispatch(modalActions.onCancel());
        return;
    }

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

export const sendRaw = (payload?: boolean): SendFormAction => ({
    type: SEND.SEND_RAW,
    payload,
});

export const pushRawTransaction = (tx: string, coin: Account['symbol']) => async (
    dispatch: Dispatch,
    getState: GetState,
) => {
    const sentTx = await TrezorConnect.pushTransaction({
        tx,
        coin,
    });

    if (sentTx.success) {
        dispatch(
            notificationActions.addToast({
                type: 'raw-tx-sent',
                txid: sentTx.payload.txid,
            }),
        );
        // raw tx doesn't have to be related to currently selected account
        // but try to update selectedAccount just to be sure
        const { account } = getState().wallet.selectedAccount;
        if (account) {
            dispatch(accountActions.fetchAndUpdateAccount(account));
        }
    } else {
        dispatch(
            notificationActions.addToast({ type: 'sign-tx-error', error: sentTx.payload.error }),
        );
    }

    // resolve sign process
    return sentTx.success;
};

export const dispose = (): SendFormAction => ({
    type: SEND.DISPOSE,
});
