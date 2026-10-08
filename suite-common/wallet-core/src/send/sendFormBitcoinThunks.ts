import { createThunk } from '@suite-common/redux-utils';
import { AddressDisplayOptions, type PrecomposedLevels } from '@suite-common/wallet-types';
import { datetimeToLocktime } from '@suite-common/wallet-utils';
import { type AccountTransaction } from '@trezor/connect';
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
import { notifyChainComposeFailure, notifyChainComposeLevels } from './walletChainSend';
import {
    type WalletSettingsRootState,
    selectAddressDisplayType,
    selectAreSatsAmountUnit,
    selectBitcoinAmountUnit,
} from '../settings/walletSettingsReducer';
import { type TransactionsRootState } from '../transactions/transactionsReducerTypes';
import { selectTransactions } from '../transactions/transactionsSelectors';

// Composing reads no transactions; signing reads the signed account's own.
const createSend = (accountTransactions: readonly AccountTransaction[] = []) =>
    createBitcoinChainSend({
        ...chainSendConnectDeps,
        datetimeToLocktime,
        getAccountTransactions: () => accountTransactions,
    });

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
            const levels = await createSend()(account.symbol).composeFeeLevels({
                account,
                draft: formState,
                context: {
                    ...composeContext,
                    isSmallestUnitEnabled: selectAreSatsAmountUnit(getState()),
                },
            });

            notifyChainComposeLevels(dispatch, levels);

            return levels;
        } catch (error) {
            if (!(error instanceof ChainSendError)) throw error;

            notifyChainComposeFailure(dispatch, error);

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
        const accountTransactions = selectTransactions(getState())[selectedAccount.key] || [];

        try {
            const { serializedTx, signedTransaction } = await createSend(accountTransactions)(
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
