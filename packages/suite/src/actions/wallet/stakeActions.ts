import { BigNumber } from '@trezor/utils/src/bigNumber';

import TrezorConnect from '@trezor/connect';
import {
    selectDevice,
    replaceTransactionThunk,
    syncAccountsWithBlockchainThunk,
    stakeActions,
} from '@suite-common/wallet-core';
import { notificationsActions } from '@suite-common/toast-notifications';
import { formatNetworkAmount, tryGetAccountIdentity } from '@suite-common/wallet-utils';

import {
    StakeFormState,
    PrecomposedTransactionFinal,
    ComposeActionContext,
    StakeType,
} from '@suite-common/wallet-types';

import * as modalActions from '../suite/modalActions';
import { Dispatch, GetState } from 'src/types/suite';

import * as stakeFormEthereumActions from './stake/stakeFormEthereumActions';
import { openModal } from '../suite/modalActions';

export const composeTransaction =
    (formValues: StakeFormState, formState: ComposeActionContext) => (dispatch: Dispatch) => {
        const { account } = formState;
        if (account.networkType === 'ethereum') {
            return dispatch(stakeFormEthereumActions.composeTransaction(formValues, formState));
        }

        return Promise.resolve(undefined);
    };

// this could be called at any time during signTransaction or pushTransaction process (from TransactionReviewModal)
export const cancelSignTx = (isSuccessTx?: boolean) => (dispatch: Dispatch, getState: GetState) => {
    const { serializedTx, precomposedForm } = getState().wallet.stake;
    dispatch(stakeActions.requestSignTransaction());
    dispatch(stakeActions.requestPushTransaction());
    // if transaction is not signed yet interrupt signing in TrezorConnect
    if (!serializedTx) {
        TrezorConnect.cancel('tx-cancelled');

        return;
    }
    // otherwise just close modal and open stake modal
    dispatch(modalActions.onCancel());

    const { ethereumStakeType } = precomposedForm ?? {};
    if (ethereumStakeType && !isSuccessTx) {
        dispatch(openModal({ type: ethereumStakeType }));
    }
};

// private, called from signTransaction only
const pushTransaction =
    (stakeType: StakeType) => async (dispatch: Dispatch, getState: GetState) => {
        const { serializedTx, precomposedTx } = getState().wallet.stake;
        const { account } = getState().wallet.selectedAccount;
        const device = selectDevice(getState());
        if (!serializedTx || !precomposedTx || !account) return;

        const sentTx = await TrezorConnect.pushTransaction({
            ...serializedTx,
            identity: tryGetAccountIdentity(account),
        });

        // close modal regardless result
        dispatch(modalActions.onCancel());

        const spentWithoutFee = new BigNumber(precomposedTx.totalSpent)
            .minus(precomposedTx.fee)
            .toString();

        // get total amount without fee
        const formattedAmount = formatNetworkAmount(spentWithoutFee, account.symbol, true, false);

        if (sentTx.success) {
            const { txid } = sentTx.payload;
            const notificationPayload = {
                formattedAmount,
                device,
                descriptor: account.descriptor,
                symbol: account.symbol,
                txid,
            };

            if (stakeType === 'stake') {
                dispatch(
                    notificationsActions.addToast({
                        type: 'tx-staked',
                        ...notificationPayload,
                    }),
                );
            }
            if (stakeType === 'unstake') {
                dispatch(
                    notificationsActions.addToast({
                        type: 'tx-unstaked',
                        ...notificationPayload,
                    }),
                );
            }
            if (stakeType === 'claim') {
                dispatch(
                    notificationsActions.addToast({
                        type: 'tx-claimed',
                        ...notificationPayload,
                    }),
                );
            }

            if (precomposedTx.prevTxid) {
                // notification from the backend may be delayed.
                // modify affected transaction(s) in the reducer until the real account update occurs.
                // this will update transaction details (like time, fee etc.)
                dispatch(
                    replaceTransactionThunk({
                        precomposedTransaction: precomposedTx,
                        newTxid: txid,
                    }),
                );
            }

            // notification from the backend may be delayed.
            // modify affected account balance.
            // TODO: make it work with ETH accounts

            // there is no point in fetching account data right after tx submit
            //  as the account will update only after the tx is confirmed
            dispatch(syncAccountsWithBlockchainThunk(account.symbol));
        } else {
            dispatch(
                notificationsActions.addToast({
                    type: 'sign-tx-error',
                    error: sentTx.payload.error,
                }),
            );
        }

        dispatch(cancelSignTx(sentTx.success));

        // resolve sign process
        return sentTx;
    };

export const signTransaction =
    (formValues: StakeFormState, transactionInfo: PrecomposedTransactionFinal) =>
    async (dispatch: Dispatch, getState: GetState) => {
        const device = selectDevice(getState());
        const { account } = getState().wallet.selectedAccount;

        if (!device || !account) return;

        const enhancedTxInfo: PrecomposedTransactionFinal = {
            ...transactionInfo,
            rbf: false,
        };

        // store formValues and transactionInfo in send reducer to be used by TransactionReviewModal
        dispatch(
            stakeActions.requestSignTransaction({
                formValues,
                transactionInfo: enhancedTxInfo,
            }),
        );

        // TransactionReviewModal has 2 steps: signing and pushing
        // TrezorConnect emits UI.CLOSE_UI.WINDOW after the signing process
        // this action is blocked by modalActions.preserve()
        dispatch(modalActions.preserve());

        // signTransaction by Trezor
        let serializedTx: string | undefined;
        if (account.networkType === 'ethereum') {
            serializedTx = await dispatch(
                stakeFormEthereumActions.signTransaction(formValues, enhancedTxInfo),
            );
        }

        if (!serializedTx) {
            // close modal manually since UI.CLOSE_UI.WINDOW was blocked
            dispatch(modalActions.onCancel());

            const { ethereumStakeType } = formValues;
            if (ethereumStakeType) {
                dispatch(openModal({ type: ethereumStakeType }));
            }

            return;
        }

        // store serializedTx in reducer (TrezorConnect.pushTransaction params) to be used in TransactionReviewModal and pushTransaction method
        dispatch(
            stakeActions.requestPushTransaction({
                tx: serializedTx,
                coin: account.symbol,
            }),
        );

        // Open a deferred modal and get the decision
        const decision = await dispatch(
            modalActions.openDeferredModal({ type: 'review-transaction' }),
        );
        if (decision) {
            // push tx to the network
            return dispatch(pushTransaction(formValues.ethereumStakeType));
        }
    };
