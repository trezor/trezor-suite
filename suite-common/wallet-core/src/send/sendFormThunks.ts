import { G } from '@mobily/ts-belt';

import { BigNumber } from '@trezor/utils/src/bigNumber';
import { createThunk } from '@suite-common/redux-utils';
import {
    Account,
    AccountKey,
    FormState,
    GeneralPrecomposedTransactionFinal,
    PrecomposedTransactionFinal,
    PrecomposedTransactionFinalCardano,
} from '@suite-common/wallet-types';
import { notificationsActions } from '@suite-common/toast-notifications';
import { NetworkSymbol } from '@suite-common/wallet-config';
import {
    hasNetworkFeatures,
    amountToSatoshi,
    formatAmount,
    getAccountDecimals,
    getAreSatoshisUsed,
    formatNetworkAmount,
    getPendingAccount,
    isCardanoTx,
    getNetwork,
    tryGetAccountIdentity,
} from '@suite-common/wallet-utils';
import TrezorConnect, { Success, Unsuccessful } from '@trezor/connect';
import { cloneObject } from '@trezor/utils';
import { BlockbookTransaction } from '@trezor/blockchain-link-types';

import {
    addFakePendingCardanoTxThunk,
    addFakePendingTxThunk,
} from '../transactions/transactionsThunks';
import { accountsActions } from '../accounts/accountsActions';
import { selectAccountByKey } from '../accounts/accountsReducer';
import { selectDevice } from '../device/deviceReducer';
import { syncAccountsWithBlockchainThunk } from '../blockchain/blockchainThunks';
import {
    selectSendFormDrafts,
    selectSendSerializedTx,
    selectSendPrecomposedTx,
} from './sendFormReducer';
import { sendFormActions } from './sendFormActions';
import {
    signBitcoinSendFormTransactionThunk,
    composeBitcoinSendFormTransactionThunk,
} from './sendFormBitcoinThunks';
import {
    signEthereumSendFormTransactionThunk,
    composeEthereumSendFormTransactionThunk,
} from './sendFormEthereumThunks';
import {
    signCardanoSendFormTransactionThunk,
    composeCardanoSendFormTransactionThunk,
} from './sendFormCardanoThunks';
import {
    signRippleSendFormTransactionThunk,
    composeRippleSendFormTransactionThunk,
} from './sendFormRippleThunks';
import {
    signSolanaSendFormTransactionThunk,
    composeSolanaSendFormTransactionThunk,
} from './sendFormSolanaThunks';
import { SEND_MODULE_PREFIX } from './sendFormConstants';
import { ComposeActionContext } from './sendFormTypes';

export const convertSendFormDraftsBtcAmountUnitsThunk = createThunk(
    `${SEND_MODULE_PREFIX}/convertSendFormDraftsBtcAmountUnitsThunk`,
    (
        { selectedAccountKey }: { selectedAccountKey?: AccountKey },
        { dispatch, getState, extra, rejectWithValue },
    ) => {
        const {
            selectors: { selectRoute, selectAreSatsAmountUnit },
        } = extra;
        const suiteRoute = selectRoute(getState());
        const sendFormDrafts = selectSendFormDrafts(getState());
        const areSatsAmountUnit = selectAreSatsAmountUnit(getState());

        const draftEntries = Object.entries(sendFormDrafts);

        if (G.isNullable(selectedAccountKey)) {
            return rejectWithValue('Account not found.');
        }

        // draft will be saved after leaving the form anyways – don't interfere with the logic
        const isOnDesktopSendPage = suiteRoute?.name === 'wallet-send';

        draftEntries.forEach(([accountKey, draft]) => {
            const relatedAccount = selectAccountByKey(getState(), accountKey);

            const isSelectedAccount = selectedAccountKey === accountKey;

            if ((isSelectedAccount && isOnDesktopSendPage) || !relatedAccount) {
                return;
            }

            const areSatsSupported = hasNetworkFeatures(relatedAccount, 'amount-unit');

            const amountFormatter =
                areSatsAmountUnit && areSatsSupported ? amountToSatoshi : formatAmount;

            const updatedDraft = cloneObject(draft);
            const amountDecimals = getAccountDecimals(relatedAccount.symbol)!;

            updatedDraft.outputs.forEach(output => {
                if (output.amount && areSatsSupported) {
                    output.amount = amountFormatter(output.amount, amountDecimals);
                }
            });

            dispatch(
                sendFormActions.storeDraft({
                    accountKey,
                    formState: updatedDraft,
                }),
            );
        });
    },
);

export const composeSendFormTransactionThunk = createThunk(
    `${SEND_MODULE_PREFIX}/composeSendFormTransactionThunk`,
    async (
        { formValues, formState }: { formValues: FormState; formState: ComposeActionContext },
        { dispatch },
        // eslint-disable-next-line require-await
    ) => {
        const { account } = formState;
        if (account.networkType === 'bitcoin') {
            return dispatch(
                composeBitcoinSendFormTransactionThunk({ formValues, formState }),
            ).unwrap();
        }
        if (account.networkType === 'ethereum') {
            return dispatch(
                composeEthereumSendFormTransactionThunk({ formValues, formState }),
            ).unwrap();
        }
        if (account.networkType === 'ripple') {
            return dispatch(
                composeRippleSendFormTransactionThunk({ formValues, formState }),
            ).unwrap();
        }
        if (account.networkType === 'cardano') {
            return dispatch(
                composeCardanoSendFormTransactionThunk({ formValues, formState }),
            ).unwrap();
        }
        if (account.networkType === 'solana') {
            return dispatch(
                composeSolanaSendFormTransactionThunk({ formValues, formState }),
            ).unwrap();
        }
    },
);

export const cancelSignSendFormTransactionThunk = createThunk(
    `${SEND_MODULE_PREFIX}/cancelSignSendFormTransactionThunk`,
    (_, { dispatch, getState, extra }) => {
        const {
            actions: { onModalCancel },
        } = extra;
        const serializedTx = selectSendSerializedTx(getState());
        dispatch(sendFormActions.discardTransaction());
        // if transaction is not signed yet interrupt signing in TrezorConnect
        if (!serializedTx) {
            TrezorConnect.cancel('tx-cancelled');

            return;
        }
        // otherwise just close modal
        dispatch(onModalCancel());
    },
);

const synchronizeSentTransactionThunk = createThunk(
    `${SEND_MODULE_PREFIX}/synchronizePendingTransactionsThunk`,
    (
        {
            selectedAccount,
            precomposedTransaction,
            txid,
        }: {
            selectedAccount: Account;
            precomposedTransaction: GeneralPrecomposedTransactionFinal;
            txid: string;
        },
        { dispatch },
    ) => {
        // notification from the backend may be delayed.
        // modify affected account balance.
        // TODO: make it work with ETH accounts
        if (isCardanoTx(selectedAccount, precomposedTransaction)) {
            const pendingAccount = getPendingAccount({
                account: selectedAccount,
                tx: precomposedTransaction,
                txid,
            });
            if (pendingAccount) {
                // manually add fake pending tx as we don't have the data about mempool txs
                dispatch(
                    addFakePendingCardanoTxThunk({
                        precomposedTransaction,
                        txid,
                        account: selectedAccount,
                    }),
                );
                dispatch(accountsActions.updateAccount(pendingAccount));
            }
        } else if (selectedAccount.networkType === 'bitcoin') {
            dispatch(
                addFakePendingTxThunk({
                    precomposedTransaction,
                    account: selectedAccount,
                }),
            );
        } else {
            // there is no point in fetching account data right after tx submit
            //  as the account will update only after the tx is confirmed
            dispatch(syncAccountsWithBlockchainThunk(selectedAccount.symbol));
        }
    },
);

export const pushSendFormTransactionThunk = createThunk<
    Success<{ txid: string }>,
    { selectedAccount: Account },
    { rejectValue: string | Unsuccessful }
>(
    `${SEND_MODULE_PREFIX}/pushSendFormTransactionThunk`,
    async (
        { selectedAccount },
        { dispatch, getState, extra, rejectWithValue, fulfillWithValue },
    ) => {
        const {
            actions: { onModalCancel },
            selectors: { selectBitcoinAmountUnit },
        } = extra;
        const precomposedTransaction = selectSendPrecomposedTx(getState());
        const serializedTx = selectSendSerializedTx(getState());
        const device = selectDevice(getState());
        const bitcoinAmountUnit = selectBitcoinAmountUnit(getState());

        if (!serializedTx || !precomposedTransaction)
            return rejectWithValue('Transaction not found.');

        const pushTxResponse = await TrezorConnect.pushTransaction({
            ...serializedTx,
            identity: tryGetAccountIdentity(selectedAccount),
        });

        // close modal regardless result
        dispatch(onModalCancel());

        const { token } = precomposedTransaction;
        const spentWithoutFee = !token
            ? new BigNumber(precomposedTransaction.totalSpent)
                  .minus(precomposedTransaction.fee)
                  .toString()
            : '0';

        const areSatoshisUsed = getAreSatoshisUsed(bitcoinAmountUnit, selectedAccount);

        // get total amount without fee OR token amount
        const formattedAmount = token
            ? `${formatAmount(
                  precomposedTransaction.totalSpent,
                  token.decimals,
              )} ${token.symbol!.toUpperCase()}`
            : formatNetworkAmount(spentWithoutFee, selectedAccount.symbol, true, areSatoshisUsed);

        if (pushTxResponse.success) {
            const { txid } = pushTxResponse.payload;
            dispatch(
                notificationsActions.addToast({
                    type: 'tx-sent',
                    formattedAmount,
                    device,
                    descriptor: selectedAccount.descriptor,
                    symbol: selectedAccount.symbol,
                    txid,
                }),
            );

            dispatch(
                synchronizeSentTransactionThunk({
                    selectedAccount,
                    precomposedTransaction,
                    txid,
                }),
            );
        } else {
            dispatch(
                notificationsActions.addToast({
                    type: 'sign-tx-error',
                    error: pushTxResponse.payload.error,
                }),
            );
        }

        // cleanup send form state and close review modal
        dispatch(cancelSignSendFormTransactionThunk());

        return pushTxResponse.success
            ? fulfillWithValue(pushTxResponse)
            : rejectWithValue(pushTxResponse);
    },
);

// TODO: typing of parameters
// this could be called at any time during signTransaction or pushTransaction process (from TransactionReviewModal)
export const pushSendFormRawTransactionThunk = createThunk(
    `${SEND_MODULE_PREFIX}/pushSendFormRawTransactionThunk`,
    async (
        payload: { tx: string; coin: NetworkSymbol; identity?: string },
        { dispatch, fulfillWithValue, rejectWithValue },
    ) => {
        const sentTx = await TrezorConnect.pushTransaction(payload);

        if (sentTx.success) {
            dispatch(
                notificationsActions.addToast({
                    type: 'raw-tx-sent',
                    txid: sentTx.payload.txid,
                }),
            );
            dispatch(syncAccountsWithBlockchainThunk(payload.coin));

            return fulfillWithValue(true);
        }

        console.warn(sentTx.payload.error);
        dispatch(
            notificationsActions.addToast({
                type: 'sign-tx-error',
                error: sentTx.payload.error,
            }),
        );

        return rejectWithValue(sentTx.payload.error);
    },
);

export const signTransactionThunk = createThunk(
    `${SEND_MODULE_PREFIX}/signTransactionThunk`,
    async (
        {
            formValues,
            precomposedTransaction,
            selectedAccount,
        }: {
            formValues: FormState;
            precomposedTransaction:
                | PrecomposedTransactionFinal
                | PrecomposedTransactionFinalCardano;
            selectedAccount: Account;
        },
        { dispatch },
    ) => {
        // signTransaction by Trezor
        let serializedTx: string | undefined;
        let signedTx: BlockbookTransaction | undefined;
        // Type guard to differentiate between PrecomposedTransactionFinal and PrecomposedTransactionFinalCardano
        if (isCardanoTx(selectedAccount, precomposedTransaction)) {
            serializedTx = await dispatch(
                signCardanoSendFormTransactionThunk({
                    precomposedTransaction,
                    selectedAccount,
                }),
            ).unwrap();
        } else {
            const { networkType } = selectedAccount;
            if (networkType === 'bitcoin') {
                const response = await dispatch(
                    signBitcoinSendFormTransactionThunk({
                        formValues,
                        precomposedTransaction,
                        selectedAccount,
                    }),
                ).unwrap();
                serializedTx = response?.serializedTx;
                signedTx = response?.signedTransaction;
            }
            if (networkType === 'ethereum') {
                serializedTx = await dispatch(
                    signEthereumSendFormTransactionThunk({
                        formValues,
                        precomposedTransaction,
                        selectedAccount,
                    }),
                ).unwrap();
            }
            if (networkType === 'ripple') {
                serializedTx = await dispatch(
                    signRippleSendFormTransactionThunk({
                        formValues,
                        precomposedTransaction,
                        selectedAccount,
                    }),
                ).unwrap();
            }
            if (networkType === 'solana') {
                serializedTx = await dispatch(
                    signSolanaSendFormTransactionThunk({
                        formValues,
                        precomposedTransaction,
                        selectedAccount,
                    }),
                ).unwrap();
            }
        }

        if (serializedTx)
            // store serializedTx in reducer (TrezorConnect.pushTransaction params) to be used in TransactionReviewModal and pushTransaction method
            dispatch(
                sendFormActions.storeSignedTransaction({
                    serializedTx: {
                        tx: serializedTx,
                        coin: selectedAccount.symbol,
                    },
                    signedTx,
                }),
            );

        return { serializedTx, signedTx };
    },
);

export const enhancePrecomposedTransactionThunk = createThunk<
    GeneralPrecomposedTransactionFinal,
    {
        transactionFormValues: FormState;
        precomposedTransaction: GeneralPrecomposedTransactionFinal;
        selectedAccount: Account;
    },
    { rejectValue: string }
>(
    `${SEND_MODULE_PREFIX}/enhancePrecomposedTransactionThunk`,
    async (
        { transactionFormValues: formValues, precomposedTransaction, selectedAccount },
        { getState, dispatch, rejectWithValue },
    ) => {
        const device = selectDevice(getState());
        const selectedAccountNetwork = getNetwork(selectedAccount.symbol);
        if (!device) return rejectWithValue('Device not found');

        // native RBF is available since FW 1.9.4/2.3.5
        const nativeRbfAvailable =
            selectedAccount.networkType === 'bitcoin' &&
            formValues.rbfParams &&
            !device.unavailableCapabilities?.replaceTransaction;
        // decrease output is available since FW 1.10.0/2.4.0
        const decreaseOutputAvailable =
            selectedAccount.networkType === 'bitcoin' &&
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

        const enhancedPrecomposedTransaction: GeneralPrecomposedTransactionFinal = {
            ...precomposedTransaction,
        };

        if (!isCardanoTx(selectedAccount, enhancedPrecomposedTransaction)) {
            enhancedPrecomposedTransaction.rbf = formValues.options.includes('bitcoinRBF');

            if (formValues.rbfParams) {
                enhancedPrecomposedTransaction.prevTxid = formValues.rbfParams.txid;
                enhancedPrecomposedTransaction.feeDifference = new BigNumber(
                    precomposedTransaction.fee,
                )
                    .minus(formValues.rbfParams.baseFee)
                    .toFixed();
                enhancedPrecomposedTransaction.useNativeRbf = useNativeRbf;
                enhancedPrecomposedTransaction.useDecreaseOutput = hasDecreasedOutput;
            }
        }

        if (
            !isCardanoTx(selectedAccount, enhancedPrecomposedTransaction) &&
            selectedAccount.networkType === 'ethereum' &&
            enhancedPrecomposedTransaction.token?.contract &&
            selectedAccountNetwork?.chainId
        ) {
            const isTokenKnown = await fetch(
                `https://data.trezor.io/firmware/eth-definitions/chain-id/${
                    selectedAccountNetwork.chainId
                }/token-${enhancedPrecomposedTransaction.token.contract.substring(2).toLowerCase()}.dat`,
                { method: 'HEAD' },
            )
                .then(response => response.ok)
                .catch(() => false);

            enhancedPrecomposedTransaction.isTokenKnown = isTokenKnown;
        }
        // store formValues and transactionInfo in send reducer to be used by TransactionReviewModal
        dispatch(
            sendFormActions.storePrecomposedTransaction({
                accountKey: selectedAccount.key,
                enhancedFormDraft: formValues,
                precomposedTransaction: enhancedPrecomposedTransaction,
            }),
        );

        return enhancedPrecomposedTransaction;
    },
);
