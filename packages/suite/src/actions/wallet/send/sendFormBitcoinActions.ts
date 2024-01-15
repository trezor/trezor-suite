import BigNumber from 'bignumber.js';

import TrezorConnect, { FeeLevel, Params, PROTO, SignTransaction } from '@trezor/connect';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    formatNetworkAmount,
    getBitcoinComposeOutputs,
    hasNetworkFeatures,
    restoreOrigOutputsOrder,
    getUtxoOutpoint,
} from '@suite-common/wallet-utils';
import { BTC_RBF_SEQUENCE, BTC_LOCKTIME_SEQUENCE } from '@suite-common/wallet-constants';
import {
    FormState,
    ComposeActionContext,
    PrecomposedLevels,
    PrecomposedTransaction,
    PrecomposedTransactionFinal,
} from '@suite-common/wallet-types';
import { selectDevice } from '@suite-common/wallet-core';

import { Dispatch, GetState } from 'src/types/suite';
import { AddressDisplayOptions, selectAddressDisplayType } from 'src/reducers/suite/suiteReducer';

export const composeTransaction =
    (formValues: FormState, formState: ComposeActionContext) =>
    async (dispatch: Dispatch, getState: GetState) => {
        const { account, excludedUtxos, feeInfo, prison } = formState;

        const {
            settings: { bitcoinAmountUnit },
        } = getState().wallet;
        const device = selectDevice(getState());

        const isSatoshis =
            bitcoinAmountUnit === PROTO.AmountUnit.SATOSHI &&
            !device?.unavailableCapabilities?.amountUnit &&
            hasNetworkFeatures(account, 'amount-unit');

        if (!account.addresses || !account.utxo) return;

        const composeOutputs = getBitcoinComposeOutputs(formValues, account.symbol, isSatoshis);
        if (composeOutputs.length < 1) return;

        const predefinedLevels = feeInfo.levels.filter(l => l.label !== 'custom');
        // in case when selectedFee is set to 'custom' construct this FeeLevel from values
        if (formValues.selectedFee === 'custom') {
            predefinedLevels.push({
                label: 'custom',
                feePerUnit: formValues.feePerUnit,
                blocks: -1,
            });
        }

        let sequence; // Must be undefined for final transaction.
        if (formValues.options.includes('bitcoinRBF')) {
            // RBF is set, add sequence to inputs
            sequence = BTC_RBF_SEQUENCE;
        } else if (formValues.bitcoinLockTime) {
            // locktime is set, add sequence to inputs
            sequence = BTC_LOCKTIME_SEQUENCE;
        }

        // exclude unspendable utxos if coin control is not enabled
        // unspendable utxos are defined in `useSendForm` hook
        const utxo = formValues.isCoinControlEnabled
            ? formValues.selectedUtxos?.map(u => ({ ...u, required: true }))
            : account.utxo.filter(u => {
                  const outpoint = getUtxoOutpoint(u);
                  return (u as any).required || (!excludedUtxos?.[outpoint] && !prison?.[outpoint]);
              });

        // certain change addresses might be temporary blocked by coinjoin process
        // exclude addresses which exists in "prison" dataset (see coinjoinReducer/selectRegisteredUtxosByAccountKey)
        const changeAddresses = prison
            ? account.addresses.change.filter(a => !prison[a.address])
            : account.addresses.change;

        const params = {
            account: {
                path: account.path,
                addresses: {
                    ...account.addresses,
                    change: changeAddresses,
                },
                utxo,
            },
            feeLevels: predefinedLevels,
            baseFee: formValues.baseFee,
            sequence,
            outputs: composeOutputs,
            skipPermutation: !!formValues.rbfParams,
            coin: account.symbol,
        };

        const response = await TrezorConnect.composeTransaction({
            ...params,
            account: params.account, // needs to be present in order to correct resolve of @trezor/connect params overload
        });

        if (!response.success) {
            dispatch(
                notificationsActions.addToast({
                    type: 'sign-tx-error',
                    error: response.payload.error,
                }),
            );
            return;
        }

        // wrap response into PrecomposedLevels object where key is a FeeLevel label
        const wrappedResponse: PrecomposedLevels = {};
        response.payload.forEach((tx, index) => {
            const feeLabel = predefinedLevels[index].label as FeeLevel['label'];
            wrappedResponse[feeLabel] = tx as PrecomposedTransaction;
        });

        const hasAtLeastOneValid = response.payload.find(r => r.type !== 'error');
        // there is no valid tx in predefinedLevels and there is no custom level
        if (!hasAtLeastOneValid && !wrappedResponse.custom) {
            const { minFee } = feeInfo;
            const lastKnownFee = predefinedLevels[predefinedLevels.length - 1].feePerUnit;
            // define coefficient for maxFee
            // NOTE: DOGE has very large values of FeeLevels, up to several thousands sat/B, rangeGap should be greater in this case otherwise calculation takes too long
            // TODO: calculate rangeGap more precisely (percentage of range?)
            const range = new BigNumber(lastKnownFee).minus(minFee);
            const rangeGap = range.gt(1000) ? 1000 : 1;
            let maxFee = new BigNumber(lastKnownFee).minus(rangeGap);
            // generate custom levels in range from lastKnownFee minus customGap to feeInfo.minFee (coinInfo in @trezor/connect)
            const customLevels: FeeLevel[] = [];
            while (maxFee.gte(minFee)) {
                customLevels.push({ feePerUnit: maxFee.toString(), label: 'custom', blocks: -1 });
                maxFee = maxFee.minus(rangeGap);
            }

            // check if any custom level is possible
            const customLevelsResponse =
                customLevels.length > 0
                    ? await TrezorConnect.composeTransaction({
                          ...params,
                          account: params.account, // needs to be present in order to correct resolve type of @trezor/connect params overload
                          feeLevels: customLevels,
                      })
                    : ({ success: false } as const);

            if (customLevelsResponse.success) {
                const customValid = customLevelsResponse.payload.findIndex(r => r.type !== 'error');
                if (customValid >= 0) {
                    wrappedResponse.custom = customLevelsResponse.payload[
                        customValid
                    ] as PrecomposedTransaction;
                }
            }
        }

        // format max (@trezor/connect sends it as satoshi)
        // format errorMessage and catch unexpected error (other than AMOUNT_IS_NOT_ENOUGH)
        Object.keys(wrappedResponse).forEach(key => {
            const tx = wrappedResponse[key];
            console.log(wrappedResponse);

            if (tx.type !== 'error') {
                // round to
                tx.feePerByte = new BigNumber(tx.feePerByte).decimalPlaces(2).toString();
                if (typeof tx.max === 'string') {
                    tx.max = isSatoshis ? tx.max : formatNetworkAmount(tx.max, account.symbol);
                }
            } else if (['MISSING-UTXOS', 'NOT-ENOUGH-FUNDS'].includes(tx.error)) {
                const getErrorMessage = () => {
                    const isLowAnonymity =
                        account.accountType === 'coinjoin' &&
                        excludedUtxos &&
                        !!Object.values(excludedUtxos).filter(reason => reason === 'low-anonymity')
                            .length;

                    if (isLowAnonymity && !formValues.isCoinControlEnabled) {
                        return 'TR_NOT_ENOUGH_ANONYMIZED_FUNDS_WARNING';
                    }
                    return formValues.isCoinControlEnabled
                        ? 'TR_NOT_ENOUGH_SELECTED'
                        : 'AMOUNT_IS_NOT_ENOUGH';
                };

                tx.errorMessage = { id: getErrorMessage() };
            } else {
                // catch unexpected error
                dispatch(
                    notificationsActions.addToast({
                        type: 'sign-tx-error',
                        error: 'message' in tx ? tx.message : tx.error, // tx.error = 'COINSELECT' contains additional message
                    }),
                );
            }
        });

        return wrappedResponse;
    };

export const signTransaction =
    (formValues: FormState, transactionInfo: PrecomposedTransactionFinal) =>
    async (dispatch: Dispatch, getState: GetState) => {
        const state = getState();
        const {
            selectedAccount,
            settings: { bitcoinAmountUnit },
        } = state.wallet;
        const device = selectDevice(state);

        if (
            selectedAccount.status !== 'loaded' ||
            !device ||
            !transactionInfo ||
            transactionInfo.type !== 'final'
        ) {
            return;
        }

        const addressDisplayType = selectAddressDisplayType(getState());

        // transactionInfo needs some additional changes:
        const { account } = selectedAccount;

        const signEnhancement: Partial<SignTransaction> = {};

        if (formValues.bitcoinLockTime) {
            signEnhancement.locktime = new BigNumber(formValues.bitcoinLockTime).toNumber();
        }

        let refTxs;

        if (formValues.rbfParams && transactionInfo.useNativeRbf) {
            const { txid, utxo, outputs } = formValues.rbfParams;

            // normally taproot/coinjoin account doesn't require referenced transactions while signing
            // but in RBF case they are needed to obtain data of original transaction
            // passing them directly from tx history will prevent downloading them from the backend (in @trezor/connect)
            // this is essential step for coinjoin account to avoid leaking txid
            if (['coinjoin', 'taproot'].includes(account.accountType)) {
                refTxs = (state.wallet.transactions.transactions[account.key] || []).filter(
                    tx => tx.txid === txid,
                );
            }

            // override inputs and outputs of precomposed transaction
            // NOTE: RBF inputs/outputs required are to be in the same exact order as in original tx (covered by TrezorConnect.composeTransaction.skipPermutation param)
            // possible variations:
            // it's possible to add new utxo not related to the original tx at the end of the list
            // it's possible to add change-output if it not exists in original tx AND new utxo was added/used
            // it's possible to remove original change-output completely (give up all as a fee)
            // it's possible to decrease external output in favour of fee
            signEnhancement.inputs = transactionInfo.inputs.map((input, i) => {
                if (utxo[i]) {
                    return { ...input, orig_index: i, orig_hash: txid };
                }
                return input;
            });
            // NOTE: Rearranging of original outputs is not supported by the FW. Restoring original order.
            // edge-case: original tx have change-output on index 0 while new tx doesn't have change-output at all
            // or it's moved to the last position by @trezor/connect composeTransaction process.
            signEnhancement.outputs = restoreOrigOutputsOrder(
                transactionInfo.outputs,
                outputs,
                txid,
            );
        }

        if (
            hasNetworkFeatures(account, 'amount-unit') &&
            !device.unavailableCapabilities?.amountUnit
        ) {
            signEnhancement.amountUnit = bitcoinAmountUnit;
        }

        if (account.unlockPath) {
            signEnhancement.unlockPath = account.unlockPath;
        }

        const signPayload: Params<SignTransaction> = {
            device: {
                path: device.path,
                instance: device.instance,
                state: device.state,
            },
            useEmptyPassphrase: device.useEmptyPassphrase,
            inputs: transactionInfo.inputs,
            outputs: transactionInfo.outputs,
            account: {
                addresses: account.addresses!,
                transactions: refTxs,
            },
            coin: account.symbol,
            chunkify: addressDisplayType === AddressDisplayOptions.CHUNKED,
            ...signEnhancement,
        };

        const response = await TrezorConnect.signTransaction(signPayload);
        if (!response.success) {
            // catch manual error from TransactionReviewModal
            if (response.payload.error === 'tx-cancelled') return;
            dispatch(
                notificationsActions.addToast({
                    type: 'sign-tx-error',
                    error: response.payload.error,
                }),
            );
            return;
        }

        return response.payload;
    };
