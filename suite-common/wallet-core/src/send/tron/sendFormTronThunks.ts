import { createThunk } from '@suite-common/redux-utils';
import { type PrecomposedLevels } from '@suite-common/wallet-types';
import { ChainSendError } from '@trezor/network-module-suite-common-types';
import { createTronChainSend } from '@trezor/network-tron-suite-common';

import { chainSendConnectDeps, toChainSendDevice } from '../chainSendAdapter';
import { SEND_MODULE_PREFIX } from '../sendFormConstants';
import {
    type ComposeFeeLevelsError,
    type ComposeTransactionThunkArguments,
    type SignTransactionError,
    type SignTransactionThunkArguments,
} from '../sendFormTypes';
import { notifyChainComposeFailure } from '../walletChainSend';

const createSend = createTronChainSend(chainSendConnectDeps);

type ComposeTronTransactionFeeLevelsThunkState = void;

export const composeTronTransactionFeeLevelsThunk = createThunk<
    PrecomposedLevels,
    ComposeTransactionThunkArguments,
    { rejectValue: ComposeFeeLevelsError; state: ComposeTronTransactionFeeLevelsThunkState }
>(
    `${SEND_MODULE_PREFIX}/composeTronTransactionFeeLevelsThunk`,
    async ({ formState, composeContext }, { dispatch, rejectWithValue }) => {
        const { account } = composeContext;

        if (account.networkType !== 'tron') {
            return rejectWithValue({
                error: 'fee-levels-compose-failed',
                message: 'Invalid network type.',
            });
        }

        try {
            return await createSend(account.symbol).composeFeeLevels({
                account,
                draft: formState,
                context: composeContext,
            });
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

type SignTronSendFormTransactionThunkState = void;

export const signTronSendFormTransactionThunk = createThunk<
    { serializedTx: string },
    SignTransactionThunkArguments,
    { rejectValue: SignTransactionError; state: SignTronSendFormTransactionThunkState }
>(
    `${SEND_MODULE_PREFIX}/signTronSendFormTransactionThunk`,
    async ({ formState, precomposedTransaction, selectedAccount, device }, { rejectWithValue }) => {
        if (selectedAccount.networkType !== 'tron') {
            return rejectWithValue({
                error: 'sign-transaction-failed',
                message: 'Invalid network type.',
            });
        }

        try {
            const { serializedTx } = await createSend(selectedAccount.symbol).sign({
                account: selectedAccount,
                draft: formState,
                precomposed: precomposedTransaction,
                options: { device: toChainSendDevice(device) },
            });

            return { serializedTx };
        } catch (error) {
            if (!(error instanceof ChainSendError)) throw error;

            return rejectWithValue({
                error: 'sign-transaction-failed',
                message: error.message,
            });
        }
    },
);
