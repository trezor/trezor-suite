import BigNumber from 'bignumber.js';

import TrezorConnect, { PROTO, SignedTransaction } from '@trezor/connect';
import { syncAccountsWithBlockchainThunk, selectDevice } from '@suite-common/wallet-core';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    amountToSatoshi,
    formatAmount,
    getAccountDecimals,
    hasNetworkFeatures,
    isCardanoTx,
} from '@suite-common/wallet-utils';
import {
    FormState,
    ComposeActionContext,
    PrecomposedTransactionFinal,
    PrecomposedTransactionFinalCardano,
} from '@suite-common/wallet-types';
import { cloneObject } from '@trezor/utils';

import * as modalActions from 'src/actions/suite/modalActions';
import { SEND } from 'src/actions/wallet/constants';
import { Dispatch, GetState } from 'src/types/suite';
import { Account } from 'src/types/wallet';

import * as sendFormBitcoinActions from './send/sendFormBitcoinActions';
import * as sendFormEthereumActions from './send/sendFormEthereumActions';
import * as sendFormRippleActions from './send/sendFormRippleActions';
import * as sendFormSolanaActions from './send/sendFormSolanaActions';
import * as sendFormCardanoActions from './send/sendFormCardanoActions';
import { pushTransactionInternal } from './sendFormActions/pushTransactionInternal';

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

export const convertDrafts = () => (dispatch: Dispatch, getState: GetState) => {
    const { route } = getState().router;

    const {
        settings,
        accounts,
        selectedAccount,
        send: { drafts },
    } = getState().wallet;

    const draftEntries = Object.entries(drafts);

    if (!draftEntries.length) {
        return;
    }

    // draft will be saved after leaving the form anyways – don't interfere with the logic
    const isOnSendPage = route?.name === 'wallet-send';

    draftEntries.forEach(([key, draft]) => {
        const relatedAccount = accounts.find(({ key: accountKey }) => accountKey === key);

        const isSelectedAccount = selectedAccount.account?.key === relatedAccount?.key;

        if ((isSelectedAccount && isOnSendPage) || !relatedAccount) {
            return;
        }

        const areSatsSelected = settings.bitcoinAmountUnit === PROTO.AmountUnit.SATOSHI;
        const areSatsSupported = hasNetworkFeatures(relatedAccount, 'amount-unit');

        const conversionToUse =
            areSatsSelected && areSatsSupported ? amountToSatoshi : formatAmount;

        const updatedDraft = cloneObject(draft);
        const decimals = getAccountDecimals(relatedAccount.symbol)!;

        updatedDraft.outputs.forEach(output => {
            if (output.amount && areSatsSupported) {
                output.amount = conversionToUse(output.amount, decimals);
            }
        });

        dispatch({
            type: SEND.STORE_DRAFT,
            key,
            formState: updatedDraft,
        });
    });
};

export const composeTransaction =
    (formValues: FormState, formState: ComposeActionContext) => (dispatch: Dispatch) => {
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
        if (account.networkType === 'cardano') {
            return dispatch(sendFormCardanoActions.composeTransaction(formValues, formState));
        }
        if (account.networkType === 'solana') {
            return dispatch(sendFormSolanaActions.composeTransaction(formValues, formState));
        }
        return Promise.resolve(undefined);
    };

// this is only a wrapper for `openDeferredModal` since it doesn't work with `bindActionCreators`
// used in send/Address component
export const scanQrRequest = () => (dispatch: Dispatch) =>
    dispatch(modalActions.openDeferredModal({ type: 'qr-reader' }));

// this is only a wrapper for `openDeferredModal` since it doesn't work with `bindActionCreators`
// used in send/Header component
export const importRequest = () => (dispatch: Dispatch) =>
    dispatch(modalActions.openDeferredModal({ type: 'import-transaction' }));

export const signTransaction =
    (
        formValues: FormState,
        transactionInfo: PrecomposedTransactionFinal | PrecomposedTransactionFinalCardano,
    ) =>
    async (dispatch: Dispatch, getState: GetState) => {
        const device = selectDevice(getState());
        const { account, network } = getState().wallet.selectedAccount;

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
        // - do not display "rbf mode" in TransactionReviewModal
        const useNativeRbf =
            (!hasDecreasedOutput && nativeRbfAvailable) ||
            (hasDecreasedOutput && decreaseOutputAvailable);

        const enhancedTxInfo: PrecomposedTransactionFinal | PrecomposedTransactionFinalCardano = {
            ...transactionInfo,
            rbf: formValues.options.includes('bitcoinRBF'),
        };

        if (formValues.rbfParams && !isCardanoTx(account, enhancedTxInfo)) {
            enhancedTxInfo.prevTxid = formValues.rbfParams.txid;
            enhancedTxInfo.feeDifference = new BigNumber(transactionInfo.fee)
                .minus(formValues.rbfParams.baseFee)
                .toFixed();
            enhancedTxInfo.useNativeRbf = useNativeRbf;
            enhancedTxInfo.useDecreaseOutput = hasDecreasedOutput;
        }

        if (account.networkType === 'ethereum' && !isCardanoTx(account, enhancedTxInfo)) {
            const isTokenKnown = await fetch(
                `https://data.trezor.io/firmware/eth-definitions/chain-id/${network?.chainId}/token-${enhancedTxInfo.token?.contract
                    .substring(2)
                    .toLowerCase()}.dat`,
            )
                .then(response => response.ok)
                .catch(() => false);

            enhancedTxInfo.isTokenKnown = isTokenKnown;
        }

        // store formValues and transactionInfo in send reducer to be used by TransactionReviewModal
        dispatch({
            type: SEND.REQUEST_SIGN_TRANSACTION,
            payload: {
                formValues,
                transactionInfo: enhancedTxInfo,
            },
        });

        // TransactionReviewModal has 2 steps: signing and pushing
        // TrezorConnect emits UI.CLOSE_UI.WINDOW after the signing process
        // this action is blocked by modalActions.preserve()
        dispatch(modalActions.preserve());

        // signTransaction by Trezor
        let serializedTx: string | undefined;
        let signedTransaction: SignedTransaction['signedTransaction'];
        // Type guard to differentiate between PrecomposedTransactionFinal and PrecomposedTransactionFinalCardano
        if (isCardanoTx(account, enhancedTxInfo)) {
            serializedTx = await dispatch(
                sendFormCardanoActions.signTransaction(formValues, enhancedTxInfo),
            );
        } else {
            if (account.networkType === 'bitcoin') {
                const response = await dispatch(
                    sendFormBitcoinActions.signTransaction(formValues, enhancedTxInfo),
                );
                serializedTx = response?.serializedTx;
                signedTransaction = response?.signedTransaction;
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
            if (account.networkType === 'solana') {
                serializedTx = await dispatch(
                    sendFormSolanaActions.signTransaction(formValues, enhancedTxInfo),
                );
            }
        }

        if (!serializedTx) {
            // close modal manually since UI.CLOSE_UI.WINDOW was blocked
            dispatch(modalActions.onCancel());
            return;
        }

        // store serializedTx in reducer (TrezorConnect.pushTransaction params) to be used in TransactionReviewModal and pushTransaction method
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
            return dispatch(pushTransactionInternal(signedTransaction));
        }
    };

export const sendRaw = (payload?: boolean): SendFormAction => ({
    type: SEND.SEND_RAW,
    payload,
});

export const pushRawTransaction =
    (tx: string, coin: Account['symbol']) => async (dispatch: Dispatch) => {
        const sentTx = await TrezorConnect.pushTransaction({
            tx,
            coin,
        });

        if (sentTx.success) {
            dispatch(
                notificationsActions.addToast({
                    type: 'raw-tx-sent',
                    txid: sentTx.payload.txid,
                }),
            );
            dispatch(syncAccountsWithBlockchainThunk(coin));
        } else {
            console.warn(sentTx.payload.error);
            dispatch(
                notificationsActions.addToast({
                    type: 'sign-tx-error',
                    error: sentTx.payload.error,
                }),
            );
        }

        // resolve sign process
        return sentTx.success;
    };

export const dispose = (): SendFormAction => ({
    type: SEND.DISPOSE,
});
