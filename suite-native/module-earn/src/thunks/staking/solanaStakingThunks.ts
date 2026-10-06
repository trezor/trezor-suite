import { type DeviceRootState, selectSelectedDevice } from '@suite-common/device';
import { createThunk } from '@suite-common/redux-utils';
import {
    type ResolveSolanaStakingContextState,
    WALLET_SDK_SOURCE_MOBILE,
    type WalletSettingsRootState,
    applySolanaStakingSignature,
    prepareSolanaStakingSignContext,
    selectAddressDisplayType,
    sendFormActions,
} from '@suite-common/wallet-core';
import {
    type AccountKey,
    AddressDisplayOptions,
    type BaseStakeType,
    type PrecomposedTransactionFinal,
} from '@suite-common/wallet-types';
import { requestPrioritizedDeviceAccess } from '@suite-native/device-mutex';
import TrezorConnect from '@trezor/connect';

import { EARN_MODULE_PREFIX } from '../../constants';
import { type SignStakeTransactionRejectValue } from '../../types';

const SIGN_LOG_PREFIX = 'signSolanaStakingTransactionThunk';

export type SignSolanaStakingTransactionThunkState = ResolveSolanaStakingContextState &
    DeviceRootState &
    WalletSettingsRootState;

export const signSolanaStakingTransactionThunk = createThunk<
    void,
    {
        accountKey: AccountKey;
        stakeType: BaseStakeType;
        precomposedTransaction: PrecomposedTransactionFinal;
    },
    {
        rejectValue: SignStakeTransactionRejectValue;
        state: SignSolanaStakingTransactionThunkState;
    }
>(
    `${EARN_MODULE_PREFIX}/${SIGN_LOG_PREFIX}`,
    async (
        { accountKey, stakeType, precomposedTransaction },
        { dispatch, getState, rejectWithValue },
    ) => {
        try {
            const prepared = await prepareSolanaStakingSignContext(getState(), {
                accountKey,
                stakeType,
                precomposedTransaction,
                source: WALLET_SDK_SOURCE_MOBILE,
            });
            if (!prepared.ok) return rejectWithValue(prepared.error);

            const { account, txData, formState } = prepared.context;

            dispatch(
                sendFormActions.storePrecomposedTransaction({
                    formState,
                    precomposedTransaction: {
                        ...precomposedTransaction,
                        createdTimestamp: new Date().getTime(),
                    },
                    accountKey,
                }),
            );

            const addressDisplayType = selectAddressDisplayType(getState());

            const deviceAccessResponse = await requestPrioritizedDeviceAccess(() => {
                const device = selectSelectedDevice(getState());

                return TrezorConnect.solanaSignTransaction({
                    device: device
                        ? {
                              path: device.path,
                              instance: device.instance,
                              state: device.state,
                              useEmptyPassphrase: device.useEmptyPassphrase,
                          }
                        : undefined,
                    path: account.path,
                    serializedTx: txData.txShim.serializeMessage(),
                    chunkify: addressDisplayType === AddressDisplayOptions.CHUNKED,
                });
            });

            if (!deviceAccessResponse.success) {
                const message = 'Prioritized device access or stake preparation failed.';
                console.error(`${SIGN_LOG_PREFIX}: ${message}`);

                return rejectWithValue({ error: 'sign-transaction-failed', message });
            }

            const signResponse = deviceAccessResponse.payload;

            if (!signResponse.success) {
                if (signResponse.error.message === 'tx-timeout') {
                    return rejectWithValue({
                        error: 'sign-transaction-timeout',
                        errorCode: signResponse.error.code,
                        message: signResponse.error.message,
                    });
                }

                if (signResponse.error.message !== 'tx-cancelled') {
                    console.error(
                        `${SIGN_LOG_PREFIX}: Sign transaction failed: ${signResponse.error.message}`,
                    );
                }

                return rejectWithValue({
                    error: 'sign-transaction-failed',
                    errorCode: signResponse.error.code,
                    message: signResponse.error.message,
                });
            }

            const serializedTx = await applySolanaStakingSignature({
                txShim: txData.txShim,
                descriptor: account.descriptor,
                signature: signResponse.payload.signature,
            });

            dispatch(
                sendFormActions.storeSignedTransaction({
                    serializedTx: { tx: serializedTx, symbol: account.symbol },
                }),
            );
        } catch (error) {
            console.error(`${SIGN_LOG_PREFIX}: Unexpected error: ${error}`);

            return rejectWithValue(undefined);
        }
    },
);
