import { closeModal, openDeferredModal, openModal, preserveModal } from '@suite/modal';
import { selectSelectedDevice } from '@suite-common/device';
import { selectIsMevProtectionFeatureEnabled } from '@suite-common/mev';
import { EarnFlow } from '@suite-common/suite-types/src/staking';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    addFakePendingCardanoTxThunk,
    replaceTransactionThunk,
    selectIsMevProtectionEnabled,
    stakeActions,
    syncAccountsWithBlockchainThunk,
} from '@suite-common/wallet-core';
import {
    Account,
    ComposeActionContext,
    PrecomposedTransactionFinal,
    StakeFormState,
    StakeType,
    WalletAccountTransaction,
} from '@suite-common/wallet-types';
import {
    formatNetworkAmount,
    getMevProtectedTxData,
    isRbfBumpFeeTransaction,
    isSupportedAdaStakingNetworkSymbol,
    isSupportedEthStakingNetworkSymbol,
    isSupportedSolStakingNetworkSymbol,
    tryGetAccountIdentity,
} from '@suite-common/wallet-utils';
import TrezorConnect from '@trezor/connect';
import { SerializedError } from '@trezor/connect-common/src/constants/errors';
import { Err } from '@trezor/type-utils';
import { BigNumber } from '@trezor/utils';

import { Dispatch, GetState } from 'src/types/suite';

import { setPendingStakeTx } from './cardanoStakingActions';
import * as stakeFormCardanoActions from './stake/stakeFormCardanoActions';
import * as stakeFormEthereumActions from './stake/stakeFormEthereumActions';
import * as stakeFormSolanaActions from './stake/stakeFormSolanaActions';

export const composeTransaction =
    (formValues: StakeFormState, formState: ComposeActionContext) => (dispatch: Dispatch) => {
        const { account } = formState;

        if (isSupportedEthStakingNetworkSymbol(account.symbol)) {
            return dispatch(stakeFormEthereumActions.composeTransaction(formValues, formState));
        }

        if (isSupportedSolStakingNetworkSymbol(account.symbol)) {
            return dispatch(stakeFormSolanaActions.composeTransaction(formValues, formState));
        }

        if (isSupportedAdaStakingNetworkSymbol(account.symbol)) {
            return dispatch(stakeFormCardanoActions.composeTransaction(formValues, formState));
        }

        return Promise.resolve(undefined);
    };

// this could be called at any time during signTransaction or pushTransaction process (from TransactionReviewModal)
export const cancelSignTx =
    (isSuccessTx?: boolean, account?: Account) => (dispatch: Dispatch, getState: GetState) => {
        const { serializedTx, precomposedForm } = getState().wallet.stake;
        dispatch(stakeActions.requestSignTransaction());
        dispatch(stakeActions.requestPushTransaction());
        // if transaction is not signed yet interrupt signing in TrezorConnect
        if (!serializedTx) {
            TrezorConnect.cancel('tx-cancelled');

            return;
        }
        // otherwise just close modal and open stake modal
        dispatch(closeModal());

        const { stakeType } = precomposedForm ?? {};
        if (account && stakeType && !isSuccessTx) {
            switch (stakeType) {
                case 'stake':
                    dispatch(openModal({ type: stakeType, flow: EarnFlow.Stake, account }));
                    break;

                default:
                    dispatch(openModal({ type: stakeType, account }));
            }
        }
    };

// private, called from signTransaction only
const pushTransaction =
    (stakeType: StakeType) => async (dispatch: Dispatch, getState: GetState) => {
        const { serializedTx, precomposedTx } = getState().wallet.stake;
        const { account } = getState().wallet.selectedAccount;
        const device = selectSelectedDevice(getState());
        const isMevProtectionEnabled = selectIsMevProtectionEnabled(getState());
        const isMevProtectionFeatureEnabled = selectIsMevProtectionFeatureEnabled(getState());

        if (!serializedTx || !precomposedTx || !account) return;

        const txData = getMevProtectedTxData(
            serializedTx.symbol,
            serializedTx.tx,
            isMevProtectionEnabled && isMevProtectionFeatureEnabled,
        );

        const sentTx = await TrezorConnect.pushTransaction({
            tx: txData,
            coin: account.symbol,
            identity: tryGetAccountIdentity(account),
        });

        // close modal regardless result
        dispatch(closeModal());

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

            if (isRbfBumpFeeTransaction(precomposedTx)) {
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

            if (account.networkType === 'cardano') {
                const base = { withdrawal: undefined, deposit: undefined };
                let cardanoSpecific: WalletAccountTransaction['cardanoSpecific'];

                switch (stakeType) {
                    case 'stake':
                        cardanoSpecific = { ...base, subtype: 'stake_registration' };
                        break;
                    case 'change-delegate':
                        cardanoSpecific = { ...base, subtype: 'governance_delegation' };
                        break;
                    case 'unstake':
                        cardanoSpecific = { ...base, subtype: 'stake_deregistration' };
                        break;
                    case 'claim':
                        cardanoSpecific = { ...base, subtype: 'withdrawal' };
                        break;
                }

                dispatch(
                    addFakePendingCardanoTxThunk({
                        precomposedTransaction: precomposedTx,
                        txid,
                        account,
                        cardanoSpecific,
                    }),
                );
                dispatch(setPendingStakeTx(account, txid));
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
                    error: sentTx.error.message,
                }),
            );
        }

        dispatch(cancelSignTx(sentTx.success, account));

        // resolve sign process
        return sentTx;
    };

export const signTransaction =
    (formValues: StakeFormState, transactionInfo: PrecomposedTransactionFinal) =>
    async (dispatch: Dispatch, getState: GetState) => {
        const device = selectSelectedDevice(getState());
        const { account } = getState().wallet.selectedAccount;

        if (!device || !account) return;

        const enhancedTxInfo: PrecomposedTransactionFinal = {
            ...transactionInfo,
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
        // this action is blocked by preserveModal()
        dispatch(preserveModal());

        // signTransaction by Trezor
        let serializedTx: undefined | string | Err<SerializedError>;
        if (isSupportedEthStakingNetworkSymbol(account.symbol)) {
            serializedTx = await dispatch(
                stakeFormEthereumActions.signTransaction(formValues, enhancedTxInfo),
            );
        }

        if (isSupportedSolStakingNetworkSymbol(account.symbol)) {
            serializedTx = await dispatch(
                stakeFormSolanaActions.signTransaction(formValues, enhancedTxInfo),
            );
        }

        if (isSupportedAdaStakingNetworkSymbol(account.symbol)) {
            serializedTx = await dispatch(
                stakeFormCardanoActions.signTransaction(formValues, enhancedTxInfo),
            );
        }

        if (typeof serializedTx !== 'string') {
            if (serializedTx?.error?.message === 'tx-timeout') {
                return;
            }
            // close modal manually since UI.CLOSE_UI.WINDOW was blocked
            dispatch(closeModal());

            const { stakeType } = formValues;
            if (stakeType) {
                switch (stakeType) {
                    case 'stake':
                        dispatch(openModal({ type: stakeType, flow: EarnFlow.Stake, account }));
                        break;

                    default:
                        dispatch(openModal({ type: stakeType, account }));
                }
            }

            return;
        }

        // store serializedTx in reducer (TrezorConnect.pushTransaction params) to be used in TransactionReviewModal and pushTransaction method
        dispatch(
            stakeActions.requestPushTransaction({
                tx: serializedTx,
                symbol: account.symbol,
            }),
        );

        if (account?.networkType === 'cardano') {
            return dispatch(pushTransaction(formValues.stakeType));
        }

        // Open a deferred modal and get the decision
        const decision = await dispatch(openDeferredModal({ type: 'review-transaction' }));
        if (decision) {
            // push tx to the network
            return dispatch(pushTransaction(formValues.stakeType));
        }
    };
