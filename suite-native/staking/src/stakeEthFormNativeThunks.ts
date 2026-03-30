import { type DeviceRootState, selectSelectedDevice } from '@suite-common/device';
import { createThunk } from '@suite-common/redux-utils';
import { getEthNetworkAddresses } from '@suite-common/staking';
import { getNetwork } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type FeesRootState,
    type SignTransactionError,
    type SignTransactionTimeoutError,
    addFakePendingEvmTxThunk,
    ethereumGetCurrentNonceThunk,
    formDraftActions,
    selectAccountByKey,
    selectConvertedNetworkFeeInfo,
    sendFormActions,
    updateFeeInfoThunk,
} from '@suite-common/wallet-core';
import { type Account, type AccountKey } from '@suite-common/wallet-types';
import {
    getAccountIdentity,
    getEthereumEstimateFeeParams,
    getFormDraftKey,
} from '@suite-common/wallet-utils';
import { requestPrioritizedDeviceAccess } from '@suite-native/device-mutex';
import TrezorConnect from '@trezor/connect';

import {
    STAKE_CALLDATA,
    type StakePushTransactionError,
    buildEthStakeTx,
    buildStakeFormState,
    buildStakePrecomposedTx,
    selectPreferredFeeLevel,
} from './stakeFormNativeUtils';

const STAKE_NATIVE_MODULE_PREFIX = '@suite-native/staking';

export const signEthStakeTransactionNativeThunk = createThunk<
    { txid: string },
    { accountKey: AccountKey; amount: string },
    {
        rejectValue:
            | SignTransactionError
            | SignTransactionTimeoutError
            | StakePushTransactionError
            | undefined;
    }
>(
    `${STAKE_NATIVE_MODULE_PREFIX}/signEthStakeTransactionNativeThunk`,
    async ({ accountKey, amount }, { dispatch, rejectWithValue, getState }) => {
        const account = selectAccountByKey(getState() as AccountsRootState, accountKey);

        if (!account || account.networkType !== 'ethereum') {
            return rejectWithValue({
                error: 'sign-transaction-failed',
                message: 'Ethereum account not found.',
            });
        }

        const network = getNetwork(account.symbol);

        if (!network.chainId) {
            return rejectWithValue({
                error: 'sign-transaction-failed',
                message: 'Chain ID not found for network.',
            });
        }

        await dispatch(updateFeeInfoThunk({ networkSymbol: account.symbol }));

        const feeInfo = selectConvertedNetworkFeeInfo(getState() as FeesRootState, account.symbol);
        const feeLevel = selectPreferredFeeLevel(feeInfo?.levels);

        if (!feeLevel) {
            return rejectWithValue({
                error: 'sign-transaction-failed',
                message: 'Fee info not available.',
            });
        }

        const identity = getAccountIdentity(account);
        const { addressContractPool } = getEthNetworkAddresses(account.symbol);

        const estimatedFee = await TrezorConnect.blockchainEstimateFee({
            coin: account.symbol,
            identity,
            request: {
                blocks: [2],
                specific: {
                    from: account.descriptor,
                    ...getEthereumEstimateFeeParams(
                        addressContractPool,
                        amount,
                        undefined,
                        STAKE_CALLDATA,
                    ),
                },
            },
        });

        if (!estimatedFee.success) {
            return rejectWithValue({
                error: 'sign-transaction-failed',
                message: `Gas limit estimation failed: ${estimatedFee.error.message}`,
            });
        }

        const rawGasLimit = estimatedFee.payload.levels[0]?.feeLimit;

        if (!rawGasLimit) {
            return rejectWithValue({
                error: 'sign-transaction-failed',
                message: 'Gas limit estimation returned empty value.',
            });
        }

        const stakeFormState = buildStakeFormState(feeLevel, rawGasLimit);
        const precomposedTx = buildStakePrecomposedTx(
            feeLevel,
            rawGasLimit,
            addressContractPool,
            amount,
        );

        dispatch(
            sendFormActions.storePrecomposedTransaction({
                formState: stakeFormState,
                precomposedTransaction: precomposedTx,
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
                rawGasLimit,
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
            return rejectWithValue({
                error: 'sign-transaction-failed',
                message: 'Prioritized device access or stake preparation failed.',
            });
        }

        const signResponse = deviceAccessResponse.payload;

        if (!signResponse.success) {
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
                precomposedTransaction: precomposedTx,
                precomposedForm: stakeFormState,
                txid,
                account,
            }),
        );

        return { txid };
    },
);
