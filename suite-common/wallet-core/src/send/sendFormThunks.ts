import { G, A } from '@mobily/ts-belt';

import { BigNumber } from '@trezor/utils/src/bigNumber';
import { createThunk } from '@suite-common/redux-utils';
import {
    Account,
    AccountKey,
    ComposeActionContext,
    FormState,
    PrecomposedTransactionFinal,
    PrecomposedTransactionFinalCardano,
} from '@suite-common/wallet-types';
import { MetadataAddPayload } from '@suite-common/metadata-types';
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
import TrezorConnect from '@trezor/connect';
import { cloneObject, getSynchronize } from '@trezor/utils';
import { BlockbookTransaction } from '@trezor/blockchain-link-types';

import {
    addFakePendingCardanoTxThunk,
    addFakePendingTxThunk,
    replaceTransactionThunk,
} from '../transactions/transactionsThunks';
import { accountsActions } from '../accounts/accountsActions';
import { selectAccounts } from '../accounts/accountsReducer';
import { selectDevice } from '../device/deviceReducer';
import { syncAccountsWithBlockchainThunk } from '../blockchain/blockchainThunks';
import {
    selectSendFormDrafts,
    selectSendSerializedTx,
    selectSendPrecomposedTx,
    selectPrecomposedSendForm,
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

export const convertSendFormDraftsThunk = createThunk(
    `${SEND_MODULE_PREFIX}/convertSendFormDraftsThunk`,
    (
        { selectedAccountKey }: { selectedAccountKey?: AccountKey },
        { dispatch, getState, extra, rejectWithValue },
    ) => {
        const {
            selectors: { selectRoute, selectAreSatsAmountUnit },
        } = extra;
        const suiteRoute = selectRoute(getState());
        const sendFormDrafts = selectSendFormDrafts(getState());
        const accounts = selectAccounts(getState());
        const areSatsAmountUnit = selectAreSatsAmountUnit(getState());

        const draftEntries = Object.entries(sendFormDrafts);

        if (G.isNullable(selectedAccountKey)) {
            return rejectWithValue('Account not found.');
        }

        // draft will be saved after leaving the form anyways – don't interfere with the logic
        const isOnDesktopSendPage = suiteRoute?.name === 'wallet-send';

        draftEntries.forEach(([accountKey, draft]) => {
            const relatedAccount = accounts.find(account => account.key === accountKey);

            const isSelectedAccount = selectedAccountKey === relatedAccount?.key;

            if ((isSelectedAccount && isOnDesktopSendPage) || !relatedAccount) {
                return;
            }

            const areSatsSupported = hasNetworkFeatures(relatedAccount, 'amount-unit');

            const conversionToUse =
                areSatsAmountUnit && areSatsSupported ? amountToSatoshi : formatAmount;

            const updatedDraft = cloneObject(draft);
            const decimals = getAccountDecimals(relatedAccount.symbol)!;

            updatedDraft.outputs.forEach(output => {
                if (output.amount && areSatsSupported) {
                    output.amount = conversionToUse(output.amount, decimals);
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

export const pushSendFormTransactionThunk = createThunk(
    `${SEND_MODULE_PREFIX}/pushSendFormTransactionThunk`,
    async (
        {
            selectedAccount,
        }: {
            selectedAccount: Account;
        },
        { dispatch, getState, extra, rejectWithValue, fulfillWithValue },
    ) => {
        const {
            actions: { onModalCancel },
            selectors: { selectMetadata, selectBitcoinAmountUnit },
            thunks: { findLabelsToBeMovedOrDeleted, moveLabelsForRbfAction, addAccountMetadata },
        } = extra;
        const precomposedTx = selectSendPrecomposedTx(getState());
        const serializedTx = selectSendSerializedTx(getState());
        const device = selectDevice(getState());
        const bitcoinAmountUnit = selectBitcoinAmountUnit(getState());
        const metadata = selectMetadata(getState());

        if (!serializedTx || !precomposedTx) return rejectWithValue('Transaction not found.');

        const isRbf = precomposedTx.prevTxid !== undefined;

        const toBeMovedOrDeletedList = isRbf
            ? dispatch(findLabelsToBeMovedOrDeleted({ prevTxid: precomposedTx.prevTxid }))
            : undefined;

        const pushTxResponse = await TrezorConnect.pushTransaction({
            ...serializedTx,
            identity: tryGetAccountIdentity(selectedAccount),
        });

        // close modal regardless result
        dispatch(onModalCancel());

        const { token } = precomposedTx;
        const spentWithoutFee = !token
            ? new BigNumber(precomposedTx.totalSpent).minus(precomposedTx.fee).toString()
            : '0';

        const areSatoshisUsed = getAreSatoshisUsed(bitcoinAmountUnit, selectedAccount);

        // get total amount without fee OR token amount
        const formattedAmount = token
            ? `${formatAmount(
                  precomposedTx.totalSpent,
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

            if (isRbf) {
                if (toBeMovedOrDeletedList !== undefined) {
                    await dispatch(
                        moveLabelsForRbfAction({
                            toBeMovedOrDeletedList,
                            newTxid: txid,
                        }),
                    );
                }

                // notification from the backend may be delayed.
                // modify affected transaction(s) in the reducer until the real account update occurs.
                // this will update transaction details (like time, fee etc.)
                dispatch(
                    replaceTransactionThunk({
                        precomposedTx,
                        newTxid: txid,
                    }),
                );
            }

            // notification from the backend may be delayed.
            // modify affected account balance.
            // TODO: make it work with ETH accounts
            if (selectedAccount.networkType === 'cardano') {
                const pendingAccount = getPendingAccount({
                    account: selectedAccount,
                    tx: precomposedTx,
                    txid,
                });
                if (pendingAccount) {
                    // manually add fake pending tx as we don't have the data about mempool txs
                    dispatch(
                        addFakePendingCardanoTxThunk({
                            precomposedTx,
                            txid,
                            account: selectedAccount,
                        }),
                    );
                    dispatch(accountsActions.updateAccount(pendingAccount));
                }
            }

            if (
                selectedAccount.networkType === 'bitcoin' &&
                !isCardanoTx(selectedAccount, precomposedTx)
            ) {
                dispatch(
                    addFakePendingTxThunk({
                        precomposedTx,
                        account: selectedAccount,
                    }),
                );
            }

            if (
                selectedAccount.networkType !== 'bitcoin' &&
                selectedAccount.networkType !== 'cardano'
            ) {
                // there is no point in fetching account data right after tx submit
                //  as the account will update only after the tx is confirmed
                dispatch(syncAccountsWithBlockchainThunk(selectedAccount.symbol));
            }

            // handle metadata (labeling) from send form
            if (metadata.enabled) {
                const precomposedForm = selectPrecomposedSendForm(getState());
                let outputsPermutation: number[];
                if (isCardanoTx(selectedAccount, precomposedTx)) {
                    // cardano preserves order of outputs
                    outputsPermutation = precomposedTx?.outputs.map((_o, i) => i);
                } else {
                    outputsPermutation = precomposedTx?.outputsPermutation;
                }

                const synchronize = getSynchronize();

                precomposedForm?.outputs
                    // create array of metadata objects
                    .map((formOutput, index) => {
                        const { label } = formOutput;
                        // final ordering of outputs differs from order in send form
                        // outputsPermutation contains mapping from @trezor/utxo-lib outputs to send form outputs
                        // mapping goes like this: Array<@trezor/utxo-lib index : send form index>
                        const outputIndex = outputsPermutation.findIndex(p => p === index);
                        const outputMetadata: Extract<MetadataAddPayload, { type: 'outputLabel' }> =
                            {
                                type: 'outputLabel',
                                entityKey: selectedAccount.key,
                                txid, // txid becomes available, use it
                                outputIndex,
                                value: label,
                                defaultValue: '',
                            };

                        return outputMetadata;
                    })
                    // filter out empty values AFTER creating metadata objects (see outputs mapping above)
                    .filter(output => output.value)
                    // propagate metadata to reducers and persistent storage
                    .forEach((output, index, arr) => {
                        const isLast = index === arr.length - 1;

                        synchronize(() =>
                            dispatch(addAccountMetadata({ ...output, skipSave: !isLast })),
                        );
                    });
            }

            dispatch(cancelSignSendFormTransactionThunk());

            return fulfillWithValue(pushTxResponse);
        }

        dispatch(
            notificationsActions.addToast({
                type: 'sign-tx-error',
                error: pushTxResponse.payload.error,
            }),
        );
        dispatch(cancelSignSendFormTransactionThunk());

        return rejectWithValue(pushTxResponse);
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

export const enhancePrecomposedTransactionThunk = createThunk(
    `${SEND_MODULE_PREFIX}/prepareTransactionForSigningThunk`,
    async (
        {
            transactionFormValues: formValues,
            precomposedTransaction,
            selectedAccount,
        }: {
            transactionFormValues: FormState;
            precomposedTransaction:
                | PrecomposedTransactionFinal
                | PrecomposedTransactionFinalCardano;
            selectedAccount: Account;
        },
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

        const enhancedPrecomposedTx:
            | PrecomposedTransactionFinal
            | PrecomposedTransactionFinalCardano = {
            ...precomposedTransaction,
            rbf: formValues.options.includes('bitcoinRBF'),
        };

        if (formValues.rbfParams && !isCardanoTx(selectedAccount, enhancedPrecomposedTx)) {
            enhancedPrecomposedTx.prevTxid = formValues.rbfParams.txid;
            enhancedPrecomposedTx.feeDifference = new BigNumber(precomposedTransaction.fee)
                .minus(formValues.rbfParams.baseFee)
                .toFixed();
            enhancedPrecomposedTx.useNativeRbf = useNativeRbf;
            enhancedPrecomposedTx.useDecreaseOutput = hasDecreasedOutput;
        }

        if (
            !isCardanoTx(selectedAccount, enhancedPrecomposedTx) &&
            selectedAccount.networkType === 'ethereum' &&
            enhancedPrecomposedTx.token?.contract &&
            selectedAccountNetwork?.chainId
        ) {
            const isTokenKnown = await fetch(
                `https://data.trezor.io/firmware/eth-definitions/chain-id/${
                    selectedAccountNetwork.chainId
                }/token-${enhancedPrecomposedTx.token.contract.substring(2).toLowerCase()}.dat`,
                { method: 'HEAD' },
            )
                .then(response => response.ok)
                .catch(() => false);

            enhancedPrecomposedTx.isTokenKnown = isTokenKnown;
        }

        // store formValues and transactionInfo in send reducer to be used by TransactionReviewModal
        dispatch(
            sendFormActions.storePrecomposedTransaction({
                formState: formValues,
                precomposedTransaction: enhancedPrecomposedTx,
            }),
        );

        return enhancedPrecomposedTx;
    },
);
