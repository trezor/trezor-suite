import TrezorConnect, { PROTO } from '@trezor/connect';
import { formatNetworkAmount, isTestnet, getDerivationType } from '@suite-common/wallet-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    FormState,
    ComposeActionContext,
    PrecomposedLevelsCardano,
    PrecomposedTransactionFinalCardano,
} from '@suite-common/wallet-types';
import { selectDevice } from '@suite-common/wallet-core';

import { Dispatch, GetState } from 'src/types/suite';
import {
    getChangeAddressParameters,
    getTtl,
    getNetworkId,
    getProtocolMagic,
    transformUserOutputs,
    transformUtxos,
    formatMaxOutputAmount,
    loadCardanoLib,
} from 'src/utils/wallet/cardanoUtils';

export const composeTransaction =
    (formValues: FormState, formState: ComposeActionContext) =>
    async (dispatch: Dispatch): Promise<PrecomposedLevelsCardano | undefined> => {
        const { account, feeInfo } = formState;
        const changeAddress = getChangeAddressParameters(account);
        if (!changeAddress || !account.utxo) return;

        const { coinSelection, trezorUtils, CoinSelectionError } = await loadCardanoLib();

        const predefinedLevels = feeInfo.levels.filter(l => l.label !== 'custom');
        if (formValues.selectedFee === 'custom') {
            predefinedLevels.push({
                label: 'custom',
                feePerUnit: formValues.feePerUnit,
                blocks: -1,
            });
        }

        const utxos = transformUtxos(account.utxo);
        const outputs = transformUserOutputs(
            formValues.outputs,
            account.tokens,
            account.symbol,
            formValues.setMaxOutputId,
        );

        const wrappedResponse: PrecomposedLevelsCardano = {};
        predefinedLevels.forEach(level => {
            const options = {
                ...(level.label === 'custom' ? { feeParams: { a: formValues.feePerUnit } } : {}),
                // debug: true, // prints debug information
            };

            try {
                const txPlan = coinSelection(
                    {
                        utxos,
                        outputs,
                        changeAddress: changeAddress.address,
                        certificates: [],
                        withdrawals: [],
                        accountPubKey: account.descriptor,
                        ttl: getTtl(isTestnet(account.symbol)),
                    },
                    options,
                );

                const tx =
                    txPlan.type === 'final'
                        ? {
                              type: txPlan.type,
                              fee: txPlan.fee,
                              feePerByte: level.feePerUnit,
                              bytes: txPlan.tx.size,
                              totalSpent: txPlan.totalSpent,
                              max: formatMaxOutputAmount(
                                  txPlan.max,
                                  outputs.find(o => o.setMax),
                                  account,
                              ), // convert from lovelace units to ADA
                              ttl: txPlan.ttl,
                              inputs: trezorUtils.transformToTrezorInputs(
                                  txPlan.inputs,
                                  account.utxo!, // for some reason TS still considers 'undefined' as possible value
                              ),
                              outputs: trezorUtils.transformToTrezorOutputs(
                                  txPlan.outputs,
                                  changeAddress.addressParameters,
                              ),
                              unsignedTx: txPlan.tx,
                          }
                        : {
                              type: txPlan.type,
                              fee: txPlan.fee,
                              feePerByte: level.feePerUnit,
                              bytes: 0,
                              totalSpent: txPlan.totalSpent,
                              max:
                                  txPlan.max && outputs.find(o => o.setMax && o.assets.length === 0)
                                      ? formatNetworkAmount(txPlan.max, account.symbol)
                                      : txPlan.max, // convert lovelace to ADA (for ADA outputs only)
                          };

                wrappedResponse[level.label] = tx;
            } catch (error) {
                if (
                    error instanceof CoinSelectionError &&
                    error.code === 'UTXO_BALANCE_INSUFFICIENT'
                ) {
                    wrappedResponse[level.label] = {
                        type: 'error',
                        error: 'AMOUNT_IS_NOT_ENOUGH',
                        errorMessage: { id: 'AMOUNT_IS_NOT_ENOUGH' },
                    };
                } else if (
                    error instanceof CoinSelectionError &&
                    error.code === 'UTXO_VALUE_TOO_SMALL'
                ) {
                    wrappedResponse[level.label] = {
                        type: 'error',
                        error: 'AMOUNT_IS_TOO_LOW',
                        errorMessage: { id: 'AMOUNT_IS_TOO_LOW' },
                    };
                } else {
                    console.warn(error);
                    // generic handling for the rest of CoinSelectionError and other unexpected errors
                    wrappedResponse[level.label] = {
                        type: 'error',
                        error: error.message,
                    };
                    dispatch(
                        notificationsActions.addToast({
                            type: 'sign-tx-error',
                            error: error.message,
                        }),
                    );
                }
            }
        });

        return wrappedResponse;
    };

export const signTransaction =
    (_formValues: FormState, transactionInfo: PrecomposedTransactionFinalCardano) =>
    async (dispatch: Dispatch, getState: GetState) => {
        const { trezorUtils } = await loadCardanoLib();
        const { selectedAccount } = getState().wallet;
        const device = selectDevice(getState());

        if (
            selectedAccount.status !== 'loaded' ||
            !device ||
            !transactionInfo ||
            transactionInfo.type !== 'final'
        )
            return;

        const { account } = selectedAccount;

        if (account.networkType !== 'cardano') return;

        const res = await TrezorConnect.cardanoSignTransaction({
            signingMode: PROTO.CardanoTxSigningMode.ORDINARY_TRANSACTION,
            device: {
                path: device.path,
                instance: device.instance,
                state: device.state,
            },
            useEmptyPassphrase: device.useEmptyPassphrase,
            inputs: transactionInfo.inputs,
            outputs: transactionInfo.outputs,
            protocolMagic: getProtocolMagic(account.symbol),
            networkId: getNetworkId(account.symbol),
            fee: transactionInfo.fee,
            ttl: transactionInfo.ttl?.toString(),
            derivationType: getDerivationType(account.accountType),
        });

        if (!res.success) {
            // catch manual error from TransactionReviewModal
            if (res.payload.error === 'tx-cancelled') return;
            dispatch(
                notificationsActions.addToast({
                    type: 'sign-tx-error',
                    error: res.payload.error,
                }),
            );
            return;
        }

        if (res.payload.hash !== transactionInfo.unsignedTx.hash) {
            console.error("Constructed transaction doesn't match the hash returned by the device.");
            dispatch(
                notificationsActions.addToast({
                    type: 'sign-tx-error',
                    error: "Constructed transaction doesn't match the hash returned by the device.",
                }),
            );
            return;
        }

        const signedTx = trezorUtils.signTransaction(
            transactionInfo.unsignedTx.body,
            res.payload.witnesses,
            {
                testnet: isTestnet(account.symbol),
            },
        );
        return signedTx;
    };
