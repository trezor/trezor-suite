import { type DeviceRootState, selectSelectedDevice } from '@suite-common/device';
import { createThunk } from '@suite-common/redux-utils';
import { getEthNetworkAddresses } from '@suite-common/staking';
import { getNetwork } from '@suite-common/wallet-config';
import {
    type SignTransactionError,
    type SignTransactionTimeoutError,
    addFakePendingEvmTxThunk,
    ethereumGetCurrentNonceThunk,
    formDraftActions,
    selectAccountByKey,
    sendFormActions,
} from '@suite-common/wallet-core';
import {
    type Account,
    type AccountKey,
    type PrecomposedTransactionFinal,
} from '@suite-common/wallet-types';
import { getAccountIdentity, getFormDraftKey } from '@suite-common/wallet-utils';
import { requestPrioritizedDeviceAccess } from '@suite-native/device-mutex';
import TrezorConnect, { type FeeLevel } from '@trezor/connect';

import {
    type StakePushTransactionError,
    buildEthStakeTx,
    buildStakeFormState,
} from './stakeFormNativeUtils';

const STAKE_NATIVE_MODULE_PREFIX = '@suite-native/staking';

export const signEthStakeTransactionNativeThunk = createThunk<
    { txid: string },
    {
        accountKey: AccountKey;
        amount: string;
        precomposedTransaction: PrecomposedTransactionFinal;
    },
    {
        rejectValue:
            | SignTransactionError
            | SignTransactionTimeoutError
            | StakePushTransactionError
            | undefined;
    }
>(
    `${STAKE_NATIVE_MODULE_PREFIX}/signEthStakeTransactionNativeThunk`,
    async (
        { accountKey, amount, precomposedTransaction },
        { dispatch, rejectWithValue, getState },
    ) => {
        try {
            const account = selectAccountByKey(getState(), accountKey);

            if (!account || account.networkType !== 'ethereum') {
                console.error(
                    `signEthStakeTransactionNativeThunk: Ethereum account not found for key ${accountKey}`,
                );

                return rejectWithValue({
                    error: 'sign-transaction-failed',
                    message: 'Ethereum account not found.',
                });
            }

            const network = getNetwork(account.symbol);

            if (!network.chainId) {
                console.error(
                    `signEthStakeTransactionNativeThunk: Chain ID not found for network ${account.symbol}`,
                );

                return rejectWithValue({
                    error: 'sign-transaction-failed',
                    message: 'Chain ID not found for network.',
                });
            }

            const gasLimit = precomposedTransaction.feeLimit;

            if (!gasLimit) {
                console.error(
                    'signEthStakeTransactionNativeThunk: Selected fee level is missing gas limit.',
                );

                return rejectWithValue({
                    error: 'sign-transaction-failed',
                    message: 'Selected fee level is missing gas limit.',
                });
            }

            const feeLevel: FeeLevel = {
                label: 'normal',
                blocks: -1,
                feePerUnit: precomposedTransaction.feePerByte,
                feeLimit: gasLimit,
                maxFeePerGas: precomposedTransaction.maxFeePerGas,
                maxPriorityFeePerGas: precomposedTransaction.maxPriorityFeePerGas,
            };

            const identity = getAccountIdentity(account);
            const { addressContractPool } = getEthNetworkAddresses(account.symbol);

            const stakeFormState = buildStakeFormState(feeLevel, gasLimit);

            dispatch(
                sendFormActions.storePrecomposedTransaction({
                    formState: stakeFormState,
                    precomposedTransaction,
                    accountKey,
                }),
            );
            dispatch(
                formDraftActions.storeDraft({
                    key: getFormDraftKey('stake', ''),
                    formDraft: stakeFormState,
                }),
            );

            const deviceAccessResponse = await requestPrioritizedDeviceAccess(async () => {
                const device = selectSelectedDevice(getState() as DeviceRootState);

                const { nonce } = await dispatch(
                    ethereumGetCurrentNonceThunk({
                        selectedAccount: account as Account & { networkType: 'ethereum' },
                    }),
                ).unwrap();

                const tx = buildEthStakeTx({
                    contractAddress: addressContractPool,
                    amount,
                    chainId: network.chainId!,
                    nonce,
                    gasLimit,
                    feeLevel,
                });

                return TrezorConnect.ethereumSignTransaction({
                    device: device
                        ? {
                              path: device.path,
                              instance: device.instance,
                              state: device.state,
                              useEmptyPassphrase: device.useEmptyPassphrase,
                          }
                        : undefined,
                    path: account.path,
                    transaction: tx,
                });
            });

            if (!deviceAccessResponse.success) {
                console.error(
                    'signEthStakeTransactionNativeThunk: Prioritized device access or stake preparation failed.',
                );

                return rejectWithValue({
                    error: 'sign-transaction-failed',
                    message: 'Prioritized device access or stake preparation failed.',
                });
            }

            const signResponse = deviceAccessResponse.payload;

            if (!signResponse.success) {
                if (signResponse.error.message !== 'tx-cancelled') {
                    console.error(
                        `signEthStakeTransactionNativeThunk: Sign transaction failed: ${signResponse.error.message}`,
                    );
                }

                return rejectWithValue({
                    error: 'sign-transaction-failed',
                    errorCode: signResponse.error.code,
                    message: signResponse.error.message,
                });
            }

            const { serializedTx } = signResponse.payload;

            dispatch(
                sendFormActions.storeSignedTransaction({
                    serializedTx: {
                        tx: serializedTx,
                        symbol: account.symbol,
                    },
                }),
            );

            const pushResponse = await TrezorConnect.pushTransaction({
                tx: serializedTx,
                coin: account.symbol,
                identity,
            });

            if (!pushResponse.success) {
                const isPendingConflict = pushResponse.error.message.includes(
                    'could not replace existing tx',
                );

                console.error(
                    `signEthStakeTransactionNativeThunk: Push transaction failed: ${pushResponse.error.message}`,
                );

                return rejectWithValue({
                    error: isPendingConflict
                        ? 'push-transaction-pending-conflict'
                        : 'push-transaction-failed',
                    message: pushResponse.error.message,
                });
            }

            const { txid } = pushResponse.payload;

            dispatch(
                addFakePendingEvmTxThunk({
                    precomposedTransaction,
                    precomposedForm: stakeFormState,
                    txid,
                    account,
                }),
            );

            return { txid };
        } catch (error) {
            console.error(`signEthStakeTransactionNativeThunk: Unexpected error: ${error}`);

            return rejectWithValue(undefined);
        }
    },
);
