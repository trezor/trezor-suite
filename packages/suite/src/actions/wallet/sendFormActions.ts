import BigNumber from 'bignumber.js';

import TrezorConnect, { PROTO, SignedTransaction } from '@trezor/connect';
import {
    accountsActions,
    addFakePendingCardanoTxThunk,
    addFakePendingTxThunk,
    replaceTransactionThunk,
    syncAccountsWithBlockchainThunk,
    selectDevice,
} from '@suite-common/wallet-core';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    formatNetworkAmount,
    getPendingAccount,
    getAreSatoshisUsed,
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
import * as metadataActions from 'src/actions/suite/metadataActions';
import { SEND } from 'src/actions/wallet/constants';
import { Dispatch, GetState } from 'src/types/suite';
import { Account } from 'src/types/wallet';
import { MetadataAddPayload } from 'src/types/suite/metadata';

import * as sendFormBitcoinActions from './send/sendFormBitcoinActions';
import * as sendFormEthereumActions from './send/sendFormEthereumActions';
import * as sendFormRippleActions from './send/sendFormRippleActions';
import * as sendFormCardanoActions from './send/sendFormCardanoActions';

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

// this could be called at any time during signTransaction or pushTransaction process (from TransactionReviewModal)
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
        const device = selectDevice(getState());
        if (!signedTx || !precomposedTx || !account) return;

        const sentTx = await TrezorConnect.pushTransaction(signedTx);
        // const sentTx = { success: true, payload: { txid: 'ABC ' } };

        // close modal regardless result
        dispatch(modalActions.onCancel());

        const { token } = precomposedTx;
        const spentWithoutFee = !token
            ? new BigNumber(precomposedTx.totalSpent).minus(precomposedTx.fee).toString()
            : '0';

        const areSatoshisUsed = getAreSatoshisUsed(
            getState().wallet.settings.bitcoinAmountUnit,
            account,
        );

        // get total amount without fee OR token amount
        const formattedAmount = token
            ? `${formatAmount(
                  precomposedTx.totalSpent,
                  token.decimals,
              )} ${token.symbol!.toUpperCase()}`
            : formatNetworkAmount(spentWithoutFee, account.symbol, true, areSatoshisUsed);

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
                dispatch(
                    replaceTransactionThunk({
                        precomposedTx,
                        newTxid: txid,
                        signedTransaction,
                    }),
                );
            }

            // notification from the backend may be delayed.
            // modify affected account balance.
            // TODO: make it work with ETH accounts
            if (account.networkType === 'cardano') {
                const pendingAccount = getPendingAccount({
                    account,
                    tx: precomposedTx,
                    txid,
                });
                if (pendingAccount) {
                    // manually add fake pending tx as we don't have the data about mempool txs
                    dispatch(
                        addFakePendingCardanoTxThunk({
                            precomposedTx,
                            txid,
                            account,
                        }),
                    );
                    dispatch(accountsActions.updateAccount(pendingAccount));
                }
            }

            if (
                account.networkType === 'bitcoin' &&
                !isCardanoTx(account, precomposedTx) &&
                signedTransaction // bitcoin-like should have signedTransaction always defined
            ) {
                dispatch(
                    addFakePendingTxThunk({
                        transaction: signedTransaction,
                        precomposedTx,
                        account,
                    }),
                );
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
                let outputsPermutation: number[];
                if (isCardanoTx(account, precomposedTx)) {
                    // cardano preserves order of outputs
                    outputsPermutation = precomposedTx?.outputs.map((_o, i) => i);
                } else {
                    outputsPermutation = precomposedTx?.outputsPermutation;
                }

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
                            entityKey: account.key,
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
            const response = await fetch(
                `https://data.trezor.io/firmware/eth-definitions/chain-id/${network?.chainId}/token-${enhancedTxInfo.token?.contract
                    .substring(2)
                    .toLowerCase()}.dat`,
            );

            enhancedTxInfo.isTokenKnown = response.ok;
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
            return dispatch(pushTransaction(signedTransaction));
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
