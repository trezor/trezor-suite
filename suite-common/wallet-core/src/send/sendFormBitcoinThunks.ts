import { createThunk } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { AddressDisplayOptions, type PrecomposedLevels } from '@suite-common/wallet-types';
import { datetimeToLocktime } from '@suite-common/wallet-utils';
import { createBitcoinChainSend } from '@trezor/network-bitcoin-suite-common';
import {
    ChainSendError,
    type ChainSignedTransaction,
} from '@trezor/network-module-suite-common-types';

import { chainSendConnectDeps, toChainSendDevice } from './chainSendAdapter';
import { SEND_MODULE_PREFIX } from './sendFormConstants';
import {
    type ComposeFeeLevelsError,
    type ComposeTransactionThunkArguments,
    type SignTransactionError,
    type SignTransactionThunkArguments,
} from './sendFormTypes';
import {
    type WalletSettingsRootState,
    selectAddressDisplayType,
    selectAreSatsAmountUnit,
    selectBitcoinAmountUnit,
} from '../settings/walletSettingsReducer';
import { type TransactionsRootState } from '../transactions/transactionsReducerTypes';
import { selectTransactions } from '../transactions/transactionsSelectors';

const createSend = createBitcoinChainSend({ ...chainSendConnectDeps, datetimeToLocktime });

type ComposeBitcoinTransactionFeeLevelsThunkState = WalletSettingsRootState;

export const composeBitcoinTransactionFeeLevelsThunk = createThunk<
    PrecomposedLevels,
    ComposeTransactionThunkArguments,
    {
        rejectValue: ComposeFeeLevelsError;
        state: ComposeBitcoinTransactionFeeLevelsThunkState;
    }
>(
    `${SEND_MODULE_PREFIX}/composeBitcoinTransactionFeeLevelsThunk`,
    async ({ formState, composeContext }, { dispatch, getState, rejectWithValue }) => {
        const { account } = composeContext;

        try {
            const levels = await createSend(account.symbol).composeFeeLevels({
                account,
                draft: formState,
                context: {
                    ...composeContext,
                    isSmallestUnitEnabled: selectAreSatsAmountUnit(getState()),
                },
            });

            // catch unexpected error
            Object.values(levels).forEach(tx => {
                if (tx.type === 'error' && !tx.errorMessage) {
                    dispatch(
                        notificationsActions.addToast({
                            type: 'sign-tx-error',
                            error: 'message' in tx ? tx.message : tx.error, // tx.error = 'COINSELECT' contains additional message
                        }),
                    );
                }
            });

            return levels;
        } catch (error) {
            if (!(error instanceof ChainSendError)) throw error;

            const isConnectFailure = error.connectErrorCode !== undefined;
            if (isConnectFailure && error.connectErrorCode !== 'Method_InvalidParameter') {
                dispatch(
                    notificationsActions.addToast({ type: 'sign-tx-error', error: error.message }),
                );
            }

            return rejectWithValue({
                error: 'fee-levels-compose-failed',
                message: error.message,
            });
        }
    },
);

type SignBitcoinSendFormTransactionThunkState = TransactionsRootState & WalletSettingsRootState;

export const signBitcoinSendFormTransactionThunk = createThunk<
    ChainSignedTransaction,
    SignTransactionThunkArguments,
    {
        rejectValue: SignTransactionError;
        state: SignBitcoinSendFormTransactionThunkState;
    }
>(
    `${SEND_MODULE_PREFIX}/signBitcoinSendFormTransactionThunk`,
    async (
        { formState, precomposedTransaction, selectedAccount, device, paymentRequests },
        { getState, rejectWithValue },
    ) => {
        const transactions = selectTransactions(getState());

        try {
            const { serializedTx, signedTransaction } = await createSend(
                selectedAccount.symbol,
            ).sign({
                account: selectedAccount,
                draft: formState,
                precomposed: precomposedTransaction,
                options: {
                    device: toChainSendDevice(device),
                    chunkify:
                        selectAddressDisplayType(getState()) === AddressDisplayOptions.CHUNKED,
                    paymentRequests,
                    amountUnit: selectBitcoinAmountUnit(getState()),
                    replacedTransactions: transactions[selectedAccount.key] || [],
                },
            });

            return { serializedTx, signedTransaction };
        } catch (error) {
            if (!(error instanceof ChainSendError)) throw error;

            return rejectWithValue({
                error: 'sign-transaction-failed',
                errorCode: error.connectErrorCode,
                message: error.message,
            });
        }
    },
);
