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

import { buildClaimFormState, buildEthClaimTx } from './claimFormNativeUtils';
import { type StakePushTransactionError } from './stakeFormNativeUtils';

const CLAIM_NATIVE_MODULE_PREFIX = '@suite-native/stakingClaim';

export const signEthClaimTransactionNativeThunk = createThunk<
    { txid: string },
    { accountKey: AccountKey; precomposedTransaction: PrecomposedTransactionFinal },
    {
        rejectValue:
            | SignTransactionError
            | SignTransactionTimeoutError
            | StakePushTransactionError
            | undefined;
    }
>(
    `${CLAIM_NATIVE_MODULE_PREFIX}/signEthClaimTransactionNativeThunk`,
    async ({ accountKey, precomposedTransaction }, { dispatch, rejectWithValue, getState }) => {
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

        const gasLimit = precomposedTransaction.feeLimit;

        if (!gasLimit) {
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
        const { addressContractAccounting } = getEthNetworkAddresses(account.symbol);

        const claimFormState = buildClaimFormState(feeLevel, gasLimit);

        dispatch(
            sendFormActions.storePrecomposedTransaction({
                formState: claimFormState,
                precomposedTransaction,
                accountKey,
            }),
        );
        dispatch(
            formDraftActions.storeDraft({
                key: getFormDraftKey('claim', ''),
                formDraft: claimFormState,
            }),
        );

        const deviceAccessResponse = await requestPrioritizedDeviceAccess(async () => {
            const device = selectSelectedDevice(getState() as DeviceRootState);

            const { nonce } = await dispatch(
                ethereumGetCurrentNonceThunk({
                    selectedAccount: account as Account & { networkType: 'ethereum' },
                }),
            ).unwrap();

            const tx = buildEthClaimTx({
                contractAddress: addressContractAccounting,
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
            return rejectWithValue({
                error: 'sign-transaction-failed',
                message: 'Prioritized device access or claim preparation failed.',
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
                precomposedTransaction,
                precomposedForm: claimFormState,
                txid,
                account,
            }),
        );

        return { txid };
    },
);
