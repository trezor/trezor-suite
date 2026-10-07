import { createThunk } from '@suite-common/redux-utils';
import { AddressDisplayOptions, type PrecomposedLevels } from '@suite-common/wallet-types';
import { ChainSendError } from '@trezor/network-module-suite-common-types';
import {
    createSignSolanaTransaction,
    createSolanaChainSend,
} from '@trezor/network-solana-suite-common';

import { chainSendConnectDeps, toChainSendDevice } from './chainSendAdapter';
import { SEND_MODULE_PREFIX } from './sendFormConstants';
import {
    type ComposeFeeLevelsError,
    type ComposeTransactionThunkArguments,
    type SignTransactionError,
    type SignTransactionThunkArguments,
} from './sendFormTypes';
import {
    type BlockchainRootState,
    selectBlockchainBlockInfoBySymbol,
} from '../blockchain/blockchainReducer';
import {
    type WalletSettingsRootState,
    selectAddressDisplayType,
} from '../settings/walletSettingsReducer';

const signSolanaTransaction = createSignSolanaTransaction(chainSendConnectDeps);

const createSend = (getState: () => BlockchainRootState) =>
    createSolanaChainSend({
        ...chainSendConnectDeps,
        getSolanaBlockInfo: symbol => {
            const { blockhash, blockHeight } = selectBlockchainBlockInfoBySymbol(
                getState(),
                symbol,
            );

            return { blockHash: blockhash, blockHeight };
        },
    });

type ComposeSolanaTransactionFeeLevelsThunkState = BlockchainRootState;

export const composeSolanaTransactionFeeLevelsThunk = createThunk<
    PrecomposedLevels,
    ComposeTransactionThunkArguments,
    { rejectValue: ComposeFeeLevelsError; state: ComposeSolanaTransactionFeeLevelsThunkState }
>(
    `${SEND_MODULE_PREFIX}/composeSolanaTransactionFeeLevelsThunk`,
    async (
        { formState, composeContext, isNetworkReserveEnabled = false },
        { getState, rejectWithValue },
    ) => {
        const { account } = composeContext;

        if (account.networkType !== 'solana') {
            throw new Error(`Invalid network type. ${account.networkType}`);
        }

        try {
            return await createSend(getState)(account.symbol).composeFeeLevels({
                account,
                draft: formState,
                context: { ...composeContext, isNetworkReserveEnabled },
            });
        } catch (error) {
            if (!(error instanceof ChainSendError)) throw error;

            return rejectWithValue({
                error: 'fee-levels-compose-failed',
                message: error.message,
            });
        }
    },
);

type SignSolanaSendFormTransactionThunkState = WalletSettingsRootState;

export const signSolanaSendFormTransactionThunk = createThunk<
    { serializedTx: string },
    SignTransactionThunkArguments,
    {
        rejectValue: SignTransactionError;
        state: SignSolanaSendFormTransactionThunkState;
    }
>(
    `${SEND_MODULE_PREFIX}/signSolanaSendFormTransactionThunk`,
    async (
        { formState, precomposedTransaction, selectedAccount, device, paymentRequests },
        { getState, rejectWithValue },
    ) => {
        if (selectedAccount.networkType !== 'solana')
            return rejectWithValue({
                error: 'sign-transaction-failed',
                message: 'Invalid network type.',
            });

        try {
            const { serializedTx } = await signSolanaTransaction({
                account: selectedAccount,
                draft: formState,
                precomposed: precomposedTransaction,
                options: {
                    device: toChainSendDevice(device),
                    chunkify:
                        selectAddressDisplayType(getState()) === AddressDisplayOptions.CHUNKED,
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
