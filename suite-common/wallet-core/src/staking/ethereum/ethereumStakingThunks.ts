import { type DeviceRootState, selectSelectedDevice } from '@suite-common/device';
import { AddressDisplayOptions } from '@suite-common/wallet-types';
import TrezorConnect from '@trezor/connect';
import { createThunk } from '@trezor/redux-utils';

import {
    type EthereumGetCurrentNonceThunkState,
    ethereumGetCurrentNonceThunk,
} from '../../send/sendFormEthereumThunks';
import {
    type SignTransactionError,
    type SignTransactionTimeoutError,
} from '../../send/sendFormTypes';
import {
    type WalletSettingsRootState,
    selectAddressDisplayType,
} from '../../settings/walletSettingsReducer';
import { STAKE_MODULE_PREFIX, stakeActions } from '../stakingActions';
import {
    type PreparedEthereumStakingContext,
    type StakeLiveStateInvalidError,
    buildEthereumStakingSignTransaction,
    verifyEthereumStakingLiveStateForSign,
} from './ethereumStakingSignUtils';

export type SignPreparedEthereumStakingTransactionRejectValue =
    SignTransactionError | SignTransactionTimeoutError | StakeLiveStateInvalidError;

export type SignPreparedEthereumStakingTransactionThunkState = DeviceRootState &
    EthereumGetCurrentNonceThunkState &
    WalletSettingsRootState;

// Signs a prepared Ethereum staking transaction: re-checks the on-chain state right before the
// device call, resolves the nonce and hands the verified calldata to the device.
export const signPreparedEthereumStakingTransactionThunk = createThunk<
    { serializedTx: string },
    { context: PreparedEthereumStakingContext },
    {
        rejectValue: SignPreparedEthereumStakingTransactionRejectValue;
        state: SignPreparedEthereumStakingTransactionThunkState;
    }
>(
    `${STAKE_MODULE_PREFIX}/signPreparedEthereumStakingTransactionThunk`,
    async ({ context }, { dispatch, getState, rejectWithValue }) => {
        const { account, providerId, variant } = context;

        const liveState = await verifyEthereumStakingLiveStateForSign({
            providerId,
            stakeType: variant.stakeType,
            account,
            calldata: variant.calldata,
        });
        if (!liveState.isValid) {
            return rejectWithValue(liveState.error);
        }

        const device = selectSelectedDevice(getState());
        const addressDisplayType = selectAddressDisplayType(getState());

        const { nonce } = await dispatch(
            ethereumGetCurrentNonceThunk({
                selectedAccount: account,
                fetchConfirmedNonce: true,
            }),
        ).unwrap();

        dispatch(stakeActions.setResolvedEthereumNonce(nonce));

        const response = await TrezorConnect.ethereumSignTransaction({
            device: device
                ? {
                      path: device.path,
                      instance: device.instance,
                      state: device.state,
                      useEmptyPassphrase: device.useEmptyPassphrase,
                  }
                : undefined,
            path: account.path,
            transaction: buildEthereumStakingSignTransaction(context, nonce),
            chunkify: addressDisplayType === AddressDisplayOptions.CHUNKED,
        });

        if (!response.success) {
            return rejectWithValue({
                error:
                    response.error.message === 'tx-timeout'
                        ? 'sign-transaction-timeout'
                        : 'sign-transaction-failed',
                errorCode: response.error.code,
                message: response.error.message,
            });
        }

        return { serializedTx: response.payload.serializedTx };
    },
);
