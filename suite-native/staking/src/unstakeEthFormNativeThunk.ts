import { type DeviceRootState, selectSelectedDevice } from '@suite-common/device';
import { createThunk } from '@suite-common/redux-utils';
import { getEthNetworkAddresses } from '@suite-common/staking';
import { getNetwork } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
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

import { type StakePushTransactionError } from './stakeFormNativeUtils';
import {
    buildEthUnstakeTx,
    buildUnstakeCalldata,
    buildUnstakeFormState,
} from './unstakeFormNativeUtils';
import { ethToWei } from './utils';

const STAKE_NATIVE_MODULE_PREFIX = '@suite-native/unstaking';

export const signEthUnstakeTransactionNativeThunk = createThunk<
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
    `${STAKE_NATIVE_MODULE_PREFIX}/signEthUnstakeTransactionNativeThunk`,
    async (
        { accountKey, amount, precomposedTransaction },
        { dispatch, rejectWithValue, getState },
    ) => {
        try {
            const state = getState() as AccountsRootState & DeviceRootState;
            const account = selectAccountByKey(state, accountKey);

            if (!account || account.networkType !== 'ethereum') {
                console.error(
                    `signEthUnstakeTransactionNativeThunk: Ethereum account not found for key ${accountKey}`,
                );

                return rejectWithValue({
                    error: 'sign-transaction-failed',
                    message: 'Ethereum account not found.',
                });
            }

            const network = getNetwork(account.symbol);

            if (!network.chainId) {
                console.error(
                    `signEthUnstakeTransactionNativeThunk: Chain ID not found for network ${account.symbol}`,
                );

                return rejectWithValue({
                    error: 'sign-transaction-failed',
                    message: 'Chain ID not found for network.',
                });
            }

            const gasLimit = precomposedTransaction.feeLimit;

            if (!gasLimit) {
                console.error(
                    'signEthUnstakeTransactionNativeThunk: Selected fee level is missing gas limit.',
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

            const calldata = buildUnstakeCalldata(ethToWei(amount));
            const unstakeFormState = buildUnstakeFormState(feeLevel, gasLimit, calldata);

            dispatch(
                sendFormActions.storePrecomposedTransaction({
                    formState: unstakeFormState,
                    precomposedTransaction,
                    accountKey,
                }),
            );
            dispatch(
                formDraftActions.storeDraft({
                    key: getFormDraftKey('unstake', ''),
                    formDraft: unstakeFormState,
                }),
            );

            const deviceAccessResponse = await requestPrioritizedDeviceAccess(async () => {
                const device = selectSelectedDevice(getState() as DeviceRootState);

                const { nonce } = await dispatch(
                    ethereumGetCurrentNonceThunk({
                        selectedAccount: account as Account & { networkType: 'ethereum' },
                    }),
                ).unwrap();

                const tx = buildEthUnstakeTx({
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
                    'signEthUnstakeTransactionNativeThunk: Prioritized device access or unstake preparation failed.',
                );

                return rejectWithValue({
                    error: 'sign-transaction-failed',
                    message: 'Prioritized device access or unstake preparation failed.',
                });
            }

            const signResponse = deviceAccessResponse.payload;

            if (!signResponse.success) {
                if (signResponse.error.message !== 'tx-cancelled') {
                    console.error(
                        `signEthUnstakeTransactionNativeThunk: Sign transaction failed: ${signResponse.error.message}`,
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
                    `signEthUnstakeTransactionNativeThunk: Push transaction failed: ${pushResponse.error.message}`,
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
                    precomposedForm: unstakeFormState,
                    txid,
                    account,
                }),
            );

            return { txid };
        } catch (error) {
            console.error(`signEthUnstakeTransactionNativeThunk: Unexpected error: ${error}`);

            return rejectWithValue(undefined);
        }
    },
);
