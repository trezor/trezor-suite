import { PROTO } from '@trezor/connect';
import { isTestnet, getDerivationType } from '@suite-common/wallet-utils';
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
    getUnusedChangeAddress,
    getAddressParameters,
    getNetworkId,
    getProtocolMagic,
    transformUserOutputs,
    formatMaxOutputAmount,
} from 'src/utils/wallet/cardanoUtils';
import { cardanoComposeTransaction } from 'src/utils/wallet/cardanoComposeTransaction';
import { cardanoSignTransaction } from 'src/utils/wallet/cardanoSignTransaction';

export const composeTransaction =
    (formValues: FormState, formState: ComposeActionContext) =>
    async (dispatch: Dispatch): Promise<PrecomposedLevelsCardano | undefined> => {
        const { account, feeInfo } = formState;
        const changeAddress = getUnusedChangeAddress(account);
        if (!changeAddress || !account.utxo || !account.addresses) return;

        const predefinedLevels = feeInfo.levels.filter(l => l.label !== 'custom');
        if (formValues.selectedFee === 'custom') {
            predefinedLevels.push({
                label: 'custom',
                feePerUnit: formValues.feePerUnit,
                blocks: -1,
            });
        }

        const outputs = transformUserOutputs(
            formValues.outputs,
            account.tokens,
            account.symbol,
            formValues.setMaxOutputId,
        );

        const addressParameters = getAddressParameters(account, changeAddress.path);

        const response = await cardanoComposeTransaction({
            feeLevels: predefinedLevels,
            outputs,
            account: {
                descriptor: account.descriptor,
                addresses: account.addresses,
                utxo: account.utxo,
            },
            changeAddress,
            addressParameters,
            testnet: isTestnet(account.symbol),
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

        const wrappedResponse: PrecomposedLevelsCardano = {};
        response.payload.forEach((tx, index) => {
            switch (tx.type) {
                case 'final':
                    // convert from lovelace units to ADA
                    tx.max = formatMaxOutputAmount(
                        tx.max,
                        outputs.find(o => o.setMax),
                        account,
                    );
                    break;
                case 'nonfinal':
                    // convert lovelace to ADA (for ADA outputs only)
                    tx.max = formatMaxOutputAmount(
                        tx.max,
                        outputs.find(o => o.setMax && o.assets.length === 0),
                        account,
                    );
                    break;
                case 'error':
                    if (
                        tx.error !== 'UTXO_BALANCE_INSUFFICIENT' &&
                        tx.error !== 'UTXO_VALUE_TOO_SMALL'
                    ) {
                        dispatch(
                            notificationsActions.addToast({
                                type: 'sign-tx-error',
                                error: tx.error,
                            }),
                        );
                    }
                    break;
                // no default
            }

            const feeLabel = predefinedLevels[index].label;
            wrappedResponse[feeLabel] = tx;
        });

        return wrappedResponse;
    };

export const signTransaction =
    (_formValues: FormState, transactionInfo: PrecomposedTransactionFinalCardano) =>
    async (dispatch: Dispatch, getState: GetState) => {
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

        const res = await cardanoSignTransaction({
            signingMode: PROTO.CardanoTxSigningMode.ORDINARY_TRANSACTION,
            device: {
                path: device.path,
                instance: device.instance,
                state: device.state,
            },
            useEmptyPassphrase: device.useEmptyPassphrase,
            inputs: transactionInfo.inputs,
            outputs: transactionInfo.outputs,
            unsignedTx: transactionInfo.unsignedTx,
            testnet: isTestnet(account.symbol),
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

        return res.payload.serializedTx;
    };
