import TrezorConnect, { PROTO, PrecomposedTransactionFinalCardano } from '@trezor/connect';
import {
    isTestnet,
    getDerivationType,
    getUnusedChangeAddress,
    getAddressParameters,
    getNetworkId,
    getProtocolMagic,
    transformUserOutputs,
    formatMaxOutputAmount,
} from '@suite-common/wallet-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    PrecomposedLevelsCardano,
    PrecomposedTransactionCardano,
} from '@suite-common/wallet-types';
import { createThunk } from '@suite-common/redux-utils';

import {
    ComposeTransactionThunkArguments,
    ComposeFeeLevelsError,
    SignTransactionError,
    SignTransactionThunkArguments,
} from './sendFormTypes';
import { SEND_MODULE_PREFIX } from './sendFormConstants';

export const composeCardanoTransactionFeeLevelsThunk = createThunk<
    PrecomposedLevelsCardano,
    ComposeTransactionThunkArguments,
    { rejectValue: ComposeFeeLevelsError }
>(
    `${SEND_MODULE_PREFIX}/composeBitcoinTransactionFeeLevelsThunk`,
    async ({ formState, composeContext }, { dispatch, rejectWithValue }) => {
        const { account, feeInfo } = composeContext;
        const changeAddress = getUnusedChangeAddress(account);
        if (!changeAddress || !account.utxo || !account.addresses)
            return rejectWithValue({
                error: 'fee-levels-compose-failed',
                message: 'Change address, utxos or addresses are missing.',
            });

        const predefinedLevels = feeInfo.levels.filter(l => l.label !== 'custom');
        if (formState.selectedFee === 'custom') {
            predefinedLevels.push({
                label: 'custom',
                feePerUnit: formState.feePerUnit,
                blocks: -1,
            });
        }

        const outputs = transformUserOutputs(
            formState.outputs,
            account.tokens,
            account.symbol,
            formState.setMaxOutputId,
        );

        const addressParameters = getAddressParameters(account, changeAddress.path);

        const response = await TrezorConnect.cardanoComposeTransaction({
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

            return rejectWithValue({
                error: 'fee-levels-compose-failed',
                message: response.payload.error,
            });
        }

        const resultLevels: PrecomposedLevelsCardano = {};
        response.payload.forEach((t, index) => {
            const tx: PrecomposedTransactionCardano = t;
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
                    switch (tx.error) {
                        case 'UTXO_BALANCE_INSUFFICIENT':
                            tx.errorMessage = { id: 'AMOUNT_IS_NOT_ENOUGH' };
                            break;
                        case 'UTXO_VALUE_TOO_SMALL':
                            tx.errorMessage = { id: 'AMOUNT_IS_TOO_LOW' };
                            break;
                        default:
                            dispatch(
                                notificationsActions.addToast({
                                    type: 'sign-tx-error',
                                    error: tx.error,
                                }),
                            );
                            break;
                    }
                    break;
                // no default
            }

            const feeLabel = predefinedLevels[index].label;
            resultLevels[feeLabel] = tx;
        });

        return resultLevels;
    },
);

type SignCardanoTransactionThunkArguments = Omit<
    SignTransactionThunkArguments,
    'formState' | 'precomposedTransaction' | 'accountStatus'
> & {
    precomposedTransaction: PrecomposedTransactionFinalCardano;
};

export const signCardanoSendFormTransactionThunk = createThunk<
    { serializedTx: string },
    SignCardanoTransactionThunkArguments,
    { rejectValue: SignTransactionError }
>(
    `${SEND_MODULE_PREFIX}/signCardanoSendFormTransactionThunk`,
    async ({ precomposedTransaction, selectedAccount, device }, { rejectWithValue }) => {
        const { symbol, accountType } = selectedAccount;

        if (selectedAccount.networkType !== 'cardano')
            return rejectWithValue({
                error: 'sign-transaction-failed',
                message: 'Account network type is not Cardano.',
            });

        // todo: add chunkify once we allow it for Cardano
        const response = await TrezorConnect.cardanoSignTransaction({
            signingMode: PROTO.CardanoTxSigningMode.ORDINARY_TRANSACTION,
            device: {
                path: device.path,
                instance: device.instance,
                state: device.state,
            },
            useEmptyPassphrase: device.useEmptyPassphrase,
            inputs: precomposedTransaction.inputs,
            outputs: precomposedTransaction.outputs,
            unsignedTx: precomposedTransaction.unsignedTx,
            testnet: isTestnet(symbol),
            protocolMagic: getProtocolMagic(symbol),
            networkId: getNetworkId(symbol),
            fee: precomposedTransaction.fee,
            ttl: precomposedTransaction.ttl?.toString(),
            derivationType: getDerivationType(accountType),
        });

        if (!response.success) {
            return rejectWithValue({
                error: 'sign-transaction-failed',
                errorCode: response.payload.code,
                message: response.payload.error,
            });
        }

        return { serializedTx: response.payload.serializedTx };
    },
);
