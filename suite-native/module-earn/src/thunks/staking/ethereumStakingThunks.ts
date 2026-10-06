import { type DeviceRootState, selectSelectedDevice } from '@suite-common/device';
import { createThunk } from '@suite-common/redux-utils';
import {
    type PrepareEthereumStakingContextState,
    WALLET_SDK_SOURCE_MOBILE,
    buildEthereumStakingSignTransaction,
    ethereumGetCurrentNonceThunk,
    prepareEthereumStakingContext,
    sendFormActions,
    verifyEthereumStakingLiveStateForSign,
} from '@suite-common/wallet-core';
import {
    type AccountKey,
    type BaseStakeType,
    type PrecomposedTransactionFinal,
} from '@suite-common/wallet-types';
import { requestPrioritizedDeviceAccess } from '@suite-native/device-mutex';
import TrezorConnect from '@trezor/connect';

import { EARN_MODULE_PREFIX } from '../../constants';
import { type SignStakeTransactionRejectValue } from '../../types';

const LOG_PREFIX = 'signEthereumStakingTransactionThunk';

export type SignEthereumStakingTransactionThunkState = PrepareEthereumStakingContextState &
    DeviceRootState;

export const signEthereumStakingTransactionThunk = createThunk<
    void,
    {
        accountKey: AccountKey;
        stakeType: BaseStakeType;
        precomposedTransaction: PrecomposedTransactionFinal;
    },
    {
        rejectValue: SignStakeTransactionRejectValue;
        state: SignEthereumStakingTransactionThunkState;
    }
>(
    `${EARN_MODULE_PREFIX}/${LOG_PREFIX}`,
    async ({ accountKey, stakeType, precomposedTransaction }, thunkApi) => {
        const { dispatch, getState, rejectWithValue } = thunkApi;

        try {
            const prepared = prepareEthereumStakingContext(getState(), {
                accountKey,
                stakeType,
                precomposedTransaction,
                source: WALLET_SDK_SOURCE_MOBILE,
            });
            if (!prepared.ok) return rejectWithValue(prepared.error);

            const { account, variant, formState } = prepared.context;

            const liveState = await verifyEthereumStakingLiveStateForSign({
                stakeType,
                account,
                calldata: variant.calldata,
            });
            if (!liveState.isValid) {
                return rejectWithValue(liveState.error);
            }

            dispatch(
                sendFormActions.storePrecomposedTransaction({
                    formState,
                    precomposedTransaction,
                    accountKey,
                }),
            );

            const deviceAccessResponse = await requestPrioritizedDeviceAccess(async () => {
                const device = selectSelectedDevice(getState());

                const { nonce } = await dispatch(
                    ethereumGetCurrentNonceThunk({
                        selectedAccount: account,
                        fetchConfirmedNonce: true,
                    }),
                ).unwrap();

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
                    transaction: buildEthereumStakingSignTransaction(
                        prepared.context,
                        String(nonce),
                    ),
                });
            });

            if (!deviceAccessResponse.success) {
                const message = `Prioritized device access or ${stakeType} preparation failed.`;
                console.error(`${LOG_PREFIX}: ${message}`);

                return rejectWithValue({ error: 'sign-transaction-failed', message });
            }

            const signResponse = deviceAccessResponse.payload;

            if (!signResponse.success) {
                if (signResponse.error.message !== 'tx-cancelled') {
                    console.error(
                        `${LOG_PREFIX}: Sign transaction failed: ${signResponse.error.message}`,
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
                    serializedTx: { tx: serializedTx, symbol: account.symbol },
                }),
            );
        } catch (error) {
            console.error(`${LOG_PREFIX}: Unexpected error: ${error}`);

            return rejectWithValue(undefined);
        }
    },
);
