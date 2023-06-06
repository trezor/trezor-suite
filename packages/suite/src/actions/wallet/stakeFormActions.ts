import TrezorConnect, { SignedTransaction } from '@trezor/connect';
import BigNumber from 'bignumber.js';

import {
    accountsActions,
    addFakePendingCardanoTxThunk,
    addFakePendingTxThunk,
    replaceTransactionThunk,
    syncAccountsWithBlockchainThunk,
} from '@suite-common/wallet-core';
import * as suiteActions from '@suite-actions/suiteActions';
import { notificationsActions } from '@suite-common/toast-notifications';
import * as modalActions from '@suite-actions/modalActions';
import * as metadataActions from '@suite-actions/metadataActions';
import { SEND } from '@wallet-actions/constants';
import {
    formatNetworkAmount,
    getPendingAccount,
    getAreSatoshisUsed,
    formatAmount,
} from '@suite-common/wallet-utils';
import { isCardanoTx } from '@wallet-utils/cardanoUtils';
import { Dispatch, GetState } from '@suite-types';
import {
    FormState,
    PrecomposedTransactionFinal,
    PrecomposedTransactionFinalCardano,
} from '@suite-common/wallet-types';
import * as sendFormBitcoinActions from './send/sendFormBitcoinActions';
import * as sendFormEthereumActions from './send/sendFormEthereumActions';
import * as sendFormRippleActions from './send/sendFormRippleActions';
import { MetadataAddPayload } from '@suite/types/suite/metadata';
import * as sendFormCardanoActions from './send/sendFormCardanoActions';

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
const pushTransaction =
    (signedTransaction: SignedTransaction['signedTransaction']) =>
    async (dispatch: Dispatch, getState: GetState) => {
        const { signedTx, precomposedTx } = getState().wallet.send;
        const { account } = getState().wallet.selectedAccount;
        const { device } = getState().suite;
        if (!signedTx || !precomposedTx || !account) return;

        console.log(signedTx);

        const sentTx = await TrezorConnect.pushTransaction(signedTx);
        // const sentTx = { success: true, payload: { txid: 'ABC ' } };

        // close modal regardless result
        dispatch(modalActions.onCancel());

        const spentWithoutFee = new BigNumber(precomposedTx.totalSpent)
            .minus(precomposedTx.fee)
            .toString();

        // get total amount without fee OR token amount
        const formattedAmount = formatNetworkAmount(spentWithoutFee, account.symbol, true);

        if (sentTx.success) {
            const { txid } = sentTx.payload;
            dispatch(
                notificationsActions.addToast({
                    type: 'tx-sent',
                    formattedAmount,
                    device,
                    descriptor: account.descriptor,
                    symbol: account.symbol,
                    txid,
                }),
            );

            if (precomposedTx.prevTxid) {
                // notification from the backend may be delayed.
                // modify affected transaction(s) in the reducer until the real account update occurs.
                // this will update transaction details (like time, fee etc.)
                dispatch(replaceTransactionThunk({ tx: precomposedTx, newTxid: txid }));
            }

            if (account.networkType !== 'bitcoin' && account.networkType !== 'cardano') {
                // there is no point in fetching account data right after tx submit
                //  as the account will update only after the tx is confirmed
                dispatch(syncAccountsWithBlockchainThunk(account.symbol));
            }

            // handle metadata (labeling) from send form
            const { metadata } = getState();
            if (metadata.enabled) {
                const { precomposedForm } = getState().wallet.send;

                const outputsPermutation = precomposedTx?.transaction.outputsPermutation;

                precomposedForm?.outputs
                    // create array of metadata objects
                    .map((formOutput, index) => {
                        const { label } = formOutput;
                        // final ordering of outputs differs from order in send form
                        // outputsPermutation contains mapping from @trezor/utxo-lib outputs to send form outputs
                        // mapping goes like this: Array<@trezor/utxo-lib index : send form index>
                        const outputIndex = outputsPermutation.findIndex(p => p === index);
                        const metadata: Extract<MetadataAddPayload, { type: 'outputLabel' }> = {
                            type: 'outputLabel',
                            accountKey: account.key,
                            txid, // txid becomes available, use it
                            outputIndex,
                            value: label,
                            defaultValue: '',
                        };
                        return metadata;
                    })
                    // filter out empty values AFTER creating metadata objects (see outputs mapping above)
                    .filter(output => output.value)
                    // propagate metadata to reducers and persistent storage
                    .forEach((output, index, arr) => {
                        const isLast = index === arr.length - 1;
                        dispatch(metadataActions.addAccountMetadata(output, isLast));
                    });
            }
        } else {
            dispatch(
                notificationsActions.addToast({
                    type: 'sign-tx-error',
                    error: sentTx.payload.error,
                }),
            );
        }

        dispatch(cancelSignTx());

        // resolve sign process
        return sentTx;
    };

export const signTransaction =
    (formValues: FormState, transactionInfo: PrecomposedTransactionFinal) =>
    async (dispatch: Dispatch, getState: GetState) => {
        const { device } = getState().suite;
        const { account } = getState().wallet.selectedAccount;

        if (!device || !account) return;

        // store formValues and transactionInfo in send reducer to be used by ReviewTransaction modal
        dispatch({
            type: SEND.REQUEST_SIGN_TRANSACTION,
            payload: {
                formValues,
                transactionInfo,
            },
        });

        // signTransaction by Trezor
        let signedTransaction: SignedTransaction['signedTransaction'];
        // Type guard to differentiate between PrecomposedTransactionFinal

        const serializedTx = await dispatch(
            sendFormEthereumActions.signTransaction(formValues, transactionInfo),
        );

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
        const decision = await dispatch(
            modalActions.openDeferredModal({ type: 'review-transaction' }),
        );
        if (decision) {
            // push tx to the network
            return dispatch(pushTransaction(signedTransaction));
        }
    };
