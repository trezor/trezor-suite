import { BigNumber } from '@trezor/utils/src/bigNumber';
import TrezorConnect, {
    FeeLevel,
    Params,
    SignTransaction,
    SignedTransaction,
    DEFAULT_SORTING_STRATEGY,
} from '@trezor/connect';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    formatNetworkAmount,
    getBitcoinComposeOutputs,
    hasNetworkFeatures,
    restoreOrigOutputsOrder,
    getUtxoOutpoint,
    isRbfTransaction,
} from '@suite-common/wallet-utils';
import { BTC_LOCKTIME_SEQUENCE, BTC_RBF_SEQUENCE } from '@suite-common/wallet-constants';
import {
    Account,
    AddressDisplayOptions,
    FormState,
    PrecomposedLevels,
    PrecomposedTransaction,
} from '@suite-common/wallet-types';
import { createThunk } from '@suite-common/redux-utils';

import { selectTransactions } from '../transactions/transactionsReducer';
import { selectDevice } from '../device/deviceReducer';
import {
    ComposeTransactionThunkArguments,
    ComposeFeeLevelsError,
    SignTransactionThunkArguments,
    SignTransactionError,
} from './sendFormTypes';
import { SEND_MODULE_PREFIX } from './sendFormConstants';

type GetSequenceParams = { account: Account; formValues: FormState };

const getSequence = ({ account, formValues }: GetSequenceParams) => {
    if (hasNetworkFeatures(account, 'rbf')) {
        return BTC_RBF_SEQUENCE;
    }

    if (formValues.bitcoinLockTime) {
        return BTC_LOCKTIME_SEQUENCE;
    }

    return undefined; // Must be undefined for final (non-RBF) transaction with no locktime
};

export const composeBitcoinTransactionFeeLevelsThunk = createThunk<
    PrecomposedLevels,
    ComposeTransactionThunkArguments,
    { rejectValue: ComposeFeeLevelsError }
>(
    `${SEND_MODULE_PREFIX}/composeBitcoinTransactionFeeLevelsThunk`,
    async ({ formState, composeContext }, { dispatch, getState, extra, rejectWithValue }) => {
        const {
            selectors: { selectAreSatsAmountUnit },
        } = extra;

        const { account, excludedUtxos, feeInfo, prison } = composeContext;

        const areSatsAmountUnit = selectAreSatsAmountUnit(getState());
        const device = selectDevice(getState());

        const isSatoshis =
            areSatsAmountUnit &&
            !device?.unavailableCapabilities?.amountUnit &&
            hasNetworkFeatures(account, 'amount-unit');

        if (!account.addresses || !account.utxo)
            return rejectWithValue({
                error: 'fee-levels-compose-failed',
                message: 'Account is missing addresses or utxos.',
            });

        const composeOutputs = getBitcoinComposeOutputs(formState, account.symbol, isSatoshis);
        if (composeOutputs.length < 1)
            return rejectWithValue({
                error: 'fee-levels-compose-failed',
                message: 'Unable to compose output.',
            });

        const predefinedLevels = feeInfo.levels.filter(l => l.label !== 'custom');
        // in case when selectedFee is set to 'custom' construct this FeeLevel from values
        if (formState.selectedFee === 'custom') {
            predefinedLevels.push({
                label: 'custom',
                feePerUnit: formState.feePerUnit,
                blocks: -1,
            });
        }

        const sequence = getSequence({ account, formValues: formState });

        // exclude unspendable utxos if coin control is not enabled
        // unspendable utxos are defined in `useSendForm` hook
        const utxo = formState.isCoinControlEnabled
            ? formState.selectedUtxos?.map(u => ({ ...u, required: true }))
            : account.utxo.filter(u => {
                  const outpoint = getUtxoOutpoint(u);

                  return (u as any).required || (!excludedUtxos?.[outpoint] && !prison?.[outpoint]);
              });

        // certain change addresses might be temporary blocked by coinjoin process
        // exclude addresses which exists in "prison" dataset (see coinjoinReducer/selectRegisteredUtxosByAccountKey)
        const changeAddresses = prison
            ? account.addresses.change.filter(a => !prison[a.address])
            : account.addresses.change;

        const params: Parameters<typeof TrezorConnect.composeTransaction>[0] = {
            account: {
                path: account.path,
                addresses: {
                    ...account.addresses,
                    change: changeAddresses,
                },
                utxo,
            },
            feeLevels: predefinedLevels,
            baseFee: formState.baseFee,
            sequence,
            outputs: composeOutputs,
            sortingStrategy: formState.rbfParams !== undefined ? 'none' : DEFAULT_SORTING_STRATEGY,
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

            return rejectWithValue({
                error: 'fee-levels-compose-failed',
                message: response.payload.error,
            });
        }

        // wrap response into PrecomposedLevels object where key is a FeeLevel label
        const resultLevels: PrecomposedLevels = {};
        response.payload.forEach((tx, index) => {
            const feeLabel = predefinedLevels[index].label as FeeLevel['label'];
            resultLevels[feeLabel] = tx as PrecomposedTransaction;
        });

        const hasAtLeastOneValid = response.payload.find(r => r.type !== 'error');
        // there is no valid tx in predefinedLevels and there is no custom level
        if (!hasAtLeastOneValid && !resultLevels.custom) {
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
                customLevels.push({
                    feePerUnit: maxFee.toString(),
                    label: 'custom',
                    blocks: -1,
                });
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
                    resultLevels.custom = customLevelsResponse.payload[
                        customValid
                    ] as PrecomposedTransaction;
                }
            }
        }

        // format max (@trezor/connect sends it as satoshi)
        // format errorMessage and catch unexpected error (other than AMOUNT_IS_NOT_ENOUGH)
        Object.keys(resultLevels).forEach(key => {
            const tx = resultLevels[key];

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

                    if (isLowAnonymity && !formState.isCoinControlEnabled) {
                        return 'TR_NOT_ENOUGH_ANONYMIZED_FUNDS_WARNING';
                    }

                    return formState.isCoinControlEnabled
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

        return resultLevels;
    },
);

export const signBitcoinSendFormTransactionThunk = createThunk<
    SignedTransaction,
    SignTransactionThunkArguments,
    { rejectValue: SignTransactionError }
>(
    `${SEND_MODULE_PREFIX}/signBitcoinSendFormTransactionThunk`,
    async (
        { formState, precomposedTransaction, selectedAccount, device },
        { getState, extra, rejectWithValue },
    ) => {
        const {
            selectors: { selectBitcoinAmountUnit, selectAddressDisplayType },
        } = extra;

        const bitcoinAmountUnit = selectBitcoinAmountUnit(getState());
        const transactions = selectTransactions(getState());
        const addressDisplayType = selectAddressDisplayType(getState());

        // transactionInfo needs some additional changes:
        const signEnhancement: Partial<SignTransaction> = {};

        if (formState.bitcoinLockTime) {
            signEnhancement.locktime = new BigNumber(formState.bitcoinLockTime).toNumber();
        }
        if (formState.rbfParams?.locktime) {
            signEnhancement.locktime = formState.rbfParams.locktime;
        }

        let refTxs;

        if (
            formState.rbfParams &&
            isRbfTransaction(precomposedTransaction) &&
            precomposedTransaction.useNativeRbf
        ) {
            const { txid, utxo, outputs } = formState.rbfParams;

            // normally taproot/coinjoin account doesn't require referenced transactions while signing
            // but in RBF case they are needed to obtain data of original transaction
            // passing them directly from tx history will prevent downloading them from the backend (in @trezor/connect)
            // this is essential step for coinjoin account to avoid leaking txid
            if (['coinjoin', 'taproot'].includes(selectedAccount.accountType)) {
                refTxs = (transactions[selectedAccount.key] || []).filter(tx => tx.txid === txid);
            }

            // override inputs and outputs of precomposed transaction
            // NOTE: RBF inputs/outputs required are to be in the same exact order as in original tx (covered by TrezorConnect.composeTransaction.sortStrategy='none param)
            // possible variations:
            // it's possible to add new utxo not related to the original tx at the end of the list
            // it's possible to add change-output if it not exists in original tx AND new utxo was added/used
            // it's possible to remove original change-output completely (give up all as a fee)
            // it's possible to decrease external output in favour of fee
            signEnhancement.inputs = precomposedTransaction.inputs.map((input, i) => {
                if (utxo[i]) {
                    return { ...input, orig_index: i, orig_hash: txid };
                }

                return input;
            });
            // NOTE: Rearranging of original outputs is not supported by the FW. Restoring original order.
            // edge-case: original tx have change-output on index 0 while new tx doesn't have change-output at all
            // or it's moved to the last position by @trezor/connect composeTransaction process.
            signEnhancement.outputs = restoreOrigOutputsOrder(
                precomposedTransaction.outputs,
                outputs,
                txid,
            );
        }

        if (
            hasNetworkFeatures(selectedAccount, 'amount-unit') &&
            !device.unavailableCapabilities?.amountUnit
        ) {
            signEnhancement.amountUnit = bitcoinAmountUnit;
        }

        if (selectedAccount.unlockPath) {
            signEnhancement.unlockPath = selectedAccount.unlockPath;
        }

        const signPayload: Params<SignTransaction> = {
            device: {
                path: device.path,
                instance: device.instance,
                state: device.state,
            },
            useEmptyPassphrase: device.useEmptyPassphrase,
            inputs: precomposedTransaction.inputs,
            outputs: precomposedTransaction.outputs,
            account: {
                addresses: selectedAccount.addresses!,
                transactions: refTxs,
            },
            coin: selectedAccount.symbol,
            chunkify: addressDisplayType === AddressDisplayOptions.CHUNKED,
            ...signEnhancement,
        };

        const response = await TrezorConnect.signTransaction(signPayload);
        if (!response.success) {
            return rejectWithValue({
                error: 'sign-transaction-failed',
                errorCode: response.payload.code,
                message: response.payload.error,
            });
        }

        return response.payload;
    },
);
