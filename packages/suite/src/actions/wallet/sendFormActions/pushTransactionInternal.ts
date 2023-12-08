import { MetadataAddPayload } from '@suite-common/metadata-types';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    selectDevice,
    replaceTransactionThunk,
    addFakePendingCardanoTxThunk,
    accountsActions,
    addFakePendingTxThunk,
    syncAccountsWithBlockchainThunk,
} from '@suite-common/wallet-core';
import {
    getAreSatoshisUsed,
    formatAmount,
    formatNetworkAmount,
    getPendingAccount,
    isCardanoTx,
} from '@suite-common/wallet-utils/libDev';
import TrezorConnect, { SignedTransaction } from '@trezor/connect';
import BigNumber from 'bignumber.js';
import { Dispatch, GetState } from 'src/types/suite';
import { selectLabelingDataForAccount } from '../../../reducers/suite/metadataReducer';
import * as modalActions from 'src/actions/suite/modalActions';
import * as metadataActions from 'src/actions/suite/metadataActions';
import { cancelSignTx } from './cancelSignTx';
import { getSynchronize } from '@trezor/utils';

/**
 * @internal This shall be called from signTransaction only!
 */
export const pushTransactionInternal =
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

            const isRbf = precomposedTx.prevTxid !== undefined;

            if (isRbf) {
                const accountMetadata = selectLabelingDataForAccount(getState(), account.key);
                const oldLabeling = accountMetadata?.outputLabels?.[precomposedTx.prevTxid];

                const synchronize = getSynchronize();

                Object.entries(oldLabeling).forEach(([outputIndex, value]) =>
                    synchronize(() =>
                        dispatch(
                            metadataActions.addMetadata({
                                type: 'outputLabel',
                                entityKey: account.key,
                                txid,
                                outputIndex: Number(outputIndex),
                                defaultValue: '',
                                value,
                            }),
                        ),
                    ),
                );

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

                const synchronize = getSynchronize();

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
                        synchronize(() =>
                            dispatch(metadataActions.addAccountMetadata(output, isLast)),
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

        dispatch(cancelSignTx());

        // resolve sign process
        return sentTx;
    };
