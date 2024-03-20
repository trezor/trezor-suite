import BigNumber from 'bignumber.js';
import { G, A } from '@mobily/ts-belt';

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
import TrezorConnect, { SignedTransaction } from '@trezor/connect';
import { cloneObject, getSynchronize } from '@trezor/utils';

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
    selectSendSignedTx,
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
        { dispatch, getState, extra },
    ) => {
        const {
            selectors: { selectRoute, selectAreSatsAmountUnit },
        } = extra;
        const suiteRoute = selectRoute(getState());
        const sendFormDrafts = selectSendFormDrafts(getState());
        const accounts = selectAccounts(getState());
        const areSatsAmountUnit = selectAreSatsAmountUnit(getState());

        const draftEntries = Object.entries(sendFormDrafts);

        if (A.isEmpty(draftEntries) || G.isNullable(selectedAccountKey)) {
            return;
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
        const signedTx = selectSendSignedTx(getState());
        dispatch(sendFormActions.discardTransaction());
        // if transaction is not signed yet interrupt signing in TrezorConnect
        if (!signedTx) {
            TrezorConnect.cancel('tx-cancelled');

            return;
        }
        // otherwise just close modal
        dispatch(onModalCancel());
    },
);

// private, called from signTransaction only
export const pushSendFormTransactionThunk = createThunk(
    `${SEND_MODULE_PREFIX}/pushSendFormTransactionThunk`,
    async (
        {
            signedTransaction,
            selectedAccount,
        }: {
            signedTransaction: SignedTransaction['signedTransaction'];
            selectedAccount: Account;
        },
        { dispatch, getState, extra },
    ) => {
        const {
            actions: { onModalCancel },
            selectors: { selectMetadata, selectBitcoinAmountUnit },
            thunks: { findLabelsToBeMovedOrDeleted, moveLabelsForRbfAction, addAccountMetadata },
        } = extra;
        const precomposedTx = selectSendPrecomposedTx(getState());
        const signedTx = selectSendSignedTx(getState());
        const device = selectDevice(getState());
        const bitcoinAmountUnit = selectBitcoinAmountUnit(getState());
        const metadata = selectMetadata(getState());

        if (!signedTx || !precomposedTx) return;

        const isRbf = precomposedTx.prevTxid !== undefined;

        const toBeMovedOrDeletedList = isRbf
            ? dispatch(findLabelsToBeMovedOrDeleted({ prevTxid: precomposedTx.prevTxid }))
            : undefined;

        const sentTx = await TrezorConnect.pushTransaction({
            ...signedTx,
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

        if (sentTx.success) {
            const { txid } = sentTx.payload;
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
                        signedTransaction,
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
                !isCardanoTx(selectedAccount, precomposedTx) &&
                signedTransaction // bitcoin-like should have signedTransaction always defined
            ) {
                dispatch(
                    addFakePendingTxThunk({
                        transaction: signedTransaction,
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
        } else {
            dispatch(
                notificationsActions.addToast({
                    type: 'sign-tx-error',
                    error: sentTx.payload.error,
                }),
            );
        }

        dispatch(cancelSignSendFormTransactionThunk());

        // resolve sign process
        return sentTx;
    },
);

// this could be called at any time during signTransaction or pushTransaction process (from TransactionReviewModal)
export const pushSendFormRawTransactionThunk = createThunk(
    `${SEND_MODULE_PREFIX}/pushSendFormRawTransactionThunk`,
    async (payload: { tx: string; coin: NetworkSymbol; identity?: string }, { dispatch }) => {
        const sentTx = await TrezorConnect.pushTransaction(payload);

        if (sentTx.success) {
            dispatch(
                notificationsActions.addToast({
                    type: 'raw-tx-sent',
                    txid: sentTx.payload.txid,
                }),
            );
            dispatch(syncAccountsWithBlockchainThunk(payload.coin));
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
    },
);

export const signTransactionThunk = createThunk(
    `${SEND_MODULE_PREFIX}/signTransactionThunk`,
    async (
        {
            formValues,
            transactionInfo,
            selectedAccount,
        }: {
            formValues: FormState;
            transactionInfo: PrecomposedTransactionFinal | PrecomposedTransactionFinalCardano;
            selectedAccount: Account;
        },
        { dispatch },
    ) => {
        // signTransaction by Trezor
        let serializedTx: string | undefined;
        let signedTransaction: SignedTransaction['signedTransaction'];
        // Type guard to differentiate between PrecomposedTransactionFinal and PrecomposedTransactionFinalCardano
        if (isCardanoTx(selectedAccount, transactionInfo)) {
            serializedTx = await dispatch(
                signCardanoSendFormTransactionThunk({
                    transactionInfo,
                    selectedAccount,
                }),
            ).unwrap();
        } else {
            const { networkType } = selectedAccount;
            if (networkType === 'bitcoin') {
                const response = await dispatch(
                    signBitcoinSendFormTransactionThunk({
                        formValues,
                        transactionInfo,
                        selectedAccount,
                    }),
                ).unwrap();
                serializedTx = response?.serializedTx;
                signedTransaction = response?.signedTransaction;
            }
            if (networkType === 'ethereum') {
                serializedTx = await dispatch(
                    signEthereumSendFormTransactionThunk({
                        formValues,
                        transactionInfo,
                        selectedAccount,
                    }),
                ).unwrap();
            }
            if (networkType === 'ripple') {
                serializedTx = await dispatch(
                    signRippleSendFormTransactionThunk({
                        formValues,
                        transactionInfo,
                        selectedAccount,
                    }),
                ).unwrap();
            }
            if (networkType === 'solana') {
                serializedTx = await dispatch(
                    signSolanaSendFormTransactionThunk({
                        formValues,
                        transactionInfo,
                        selectedAccount,
                    }),
                ).unwrap();
            }
        }

        if (serializedTx)
            // store serializedTx in reducer (TrezorConnect.pushTransaction params) to be used in TransactionReviewModal and pushTransaction method
            dispatch(
                sendFormActions.storeSignedTransaction({
                    tx: serializedTx,
                    coin: selectedAccount.symbol,
                }),
            );

        return { serializedTx, signedTransaction };
    },
);

export const prepareTransactionForSigningThunk = createThunk(
    `${SEND_MODULE_PREFIX}/prepareTransactionForSigningThunk`,
    async (
        {
            transactionFormValues: formValues,
            transactionInfo,
            selectedAccount,
        }: {
            transactionFormValues: FormState;
            transactionInfo: PrecomposedTransactionFinal | PrecomposedTransactionFinalCardano;
            selectedAccount: Account;
        },
        { getState, dispatch },
    ) => {
        const device = selectDevice(getState());
        const selectedAccountNetwork = getNetwork(selectedAccount.symbol);

        if (!device) return;

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

        const enhancedTxInfo: PrecomposedTransactionFinal | PrecomposedTransactionFinalCardano = {
            ...transactionInfo,
            rbf: formValues.options.includes('bitcoinRBF'),
        };

        if (formValues.rbfParams && !isCardanoTx(selectedAccount, enhancedTxInfo)) {
            enhancedTxInfo.prevTxid = formValues.rbfParams.txid;
            enhancedTxInfo.feeDifference = new BigNumber(transactionInfo.fee)
                .minus(formValues.rbfParams.baseFee)
                .toFixed();
            enhancedTxInfo.useNativeRbf = useNativeRbf;
            enhancedTxInfo.useDecreaseOutput = hasDecreasedOutput;
        }

        if (
            !isCardanoTx(selectedAccount, enhancedTxInfo) &&
            selectedAccount.networkType === 'ethereum' &&
            enhancedTxInfo.token?.contract &&
            selectedAccountNetwork?.chainId
        ) {
            const isTokenKnown = await fetch(
                `https://data.trezor.io/firmware/eth-definitions/chain-id/${
                    selectedAccountNetwork.chainId
                }/token-${enhancedTxInfo.token.contract.substring(2).toLowerCase()}.dat`,
                { method: 'HEAD' },
            )
                .then(response => response.ok)
                .catch(() => false);

            enhancedTxInfo.isTokenKnown = isTokenKnown;
        }

        // store formValues and transactionInfo in send reducer to be used by TransactionReviewModal
        dispatch(
            sendFormActions.storePrecomposedTransaction({
                formState: formValues,
                transactionInfo: enhancedTxInfo,
            }),
        );

        return enhancedTxInfo;
    },
);
