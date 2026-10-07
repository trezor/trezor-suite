import { createThunk } from '@suite-common/redux-utils';
import { AddressDisplayOptions, type PrecomposedLevelsCardano } from '@suite-common/wallet-types';
import { type PrecomposedTransactionFinalCardano } from '@trezor/connect';
import { createCardanoChainSend } from '@trezor/network-cardano-suite-common';
import { ChainSendError } from '@trezor/network-module-suite-common-types';

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
} from '../settings/walletSettingsReducer';

const createSend = createCardanoChainSend(chainSendConnectDeps);

type ComposeCardanoTransactionFeeLevelsThunkState = void;

export const composeCardanoTransactionFeeLevelsThunk = createThunk<
    PrecomposedLevelsCardano,
    ComposeTransactionThunkArguments,
    { rejectValue: ComposeFeeLevelsError; state: ComposeCardanoTransactionFeeLevelsThunkState }
>(
    `${SEND_MODULE_PREFIX}/composeCardanoTransactionFeeLevelsThunk`,
    async ({ formState, composeContext }, { dispatch, rejectWithValue }) => {
        const { account } = composeContext;

        try {
            const levels = await createSend(account.symbol).composeFeeLevels({
                account,
                draft: formState,
                context: composeContext,
            });

            notifyChainComposeLevels(dispatch, account, levels);

            return levels;
        } catch (error) {
            if (!(error instanceof ChainSendError)) throw error;

            notifyChainComposeFailure(dispatch, account, error);

            return rejectWithValue({
                error: 'fee-levels-compose-failed',
                message: error.message,
            });
        }
    },
);

type SignCardanoTransactionThunkArguments = Omit<
    SignTransactionThunkArguments,
    'precomposedTransaction' | 'accountStatus'
> & {
    precomposedTransaction: PrecomposedTransactionFinalCardano;
};

type SignCardanoSendFormTransactionThunkState = WalletSettingsRootState;

export const signCardanoSendFormTransactionThunk = createThunk<
    { serializedTx: string },
    SignCardanoTransactionThunkArguments,
    {
        rejectValue: SignTransactionError;
        state: SignCardanoSendFormTransactionThunkState;
    }
>(
    `${SEND_MODULE_PREFIX}/signCardanoSendFormTransactionThunk`,
    async (
        { formState, precomposedTransaction, selectedAccount, device, paymentRequests },
        { getState, rejectWithValue },
    ) => {
        if (selectedAccount.networkType !== 'cardano')
            return rejectWithValue({
                error: 'sign-transaction-failed',
                message: 'Account network type is not Cardano.',
            });

        const addressDisplayType = selectAddressDisplayType(getState());

        try {
            const { serializedTx } = await createSend(selectedAccount.symbol).sign({
                account: selectedAccount,
                draft: formState,
                precomposed: precomposedTransaction,
                options: {
                    device: toChainSendDevice(device),
                    chunkify: addressDisplayType == AddressDisplayOptions.CHUNKED,
                    paymentRequests,
                },
            });

            return { serializedTx };
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
