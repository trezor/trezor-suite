import { createThunk } from '@suite-common/redux-utils';
import {
    type Account,
    AddressDisplayOptions,
    type PrecomposedLevels,
} from '@suite-common/wallet-types';
import { resolveStellarContractId } from '@suite-common/wallet-utils';
import { ChainSendError } from '@trezor/network-module-suite-common-types';
import { createRippleChainSend } from '@trezor/network-ripple-suite-common';
import { createStellarChainSend } from '@trezor/network-stellar-suite-common';

import { chainSendConnectDeps, toChainSendDevice } from './chainSendAdapter';
import { SEND_MODULE_PREFIX } from './sendFormConstants';
import {
    type ComposeFeeLevelsError,
    type ComposeTransactionThunkArguments,
    type SignTransactionError,
    type SignTransactionThunkArguments,
} from './sendFormTypes';
import { type BlockchainRootState } from '../blockchain/blockchainReducer';
import { selectBlockchainUrl } from '../blockchain/blockchainSelectors';
import {
    type WalletSettingsRootState,
    selectAddressDisplayType,
} from '../settings/walletSettingsReducer';

const createRippleSend = createRippleChainSend(chainSendConnectDeps);

const getSend = (account: Account, getState: () => BlockchainRootState) => {
    if (account.networkType === 'ripple') return createRippleSend(account.symbol);
    if (account.networkType !== 'stellar') return undefined;

    return createStellarChainSend({
        ...chainSendConnectDeps,
        getStellarBackendUrl: symbol => selectBlockchainUrl(getState(), symbol),
        resolveStellarContractId,
    })(account.symbol);
};

type ComposeRippleStellarTransactionFeeLevelsThunkState = BlockchainRootState;

export const composeRippleStellarTransactionFeeLevelsThunk = createThunk<
    PrecomposedLevels,
    ComposeTransactionThunkArguments,
    {
        rejectValue: ComposeFeeLevelsError;
        state: ComposeRippleStellarTransactionFeeLevelsThunkState;
    }
>(
    `${SEND_MODULE_PREFIX}/composeRippleStellarTransactionFeeLevelsThunk`,
    async ({ formState, composeContext }, { getState, rejectWithValue }) => {
        const { account } = composeContext;
        const send = getSend(account, getState);

        if (!send) {
            return rejectWithValue({
                error: 'fee-levels-compose-failed',
                message: 'Invalid network type.',
            });
        }

        try {
            return await send.composeFeeLevels({
                account,
                draft: formState,
                context: composeContext,
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

type SignRippleStellarSendFormTransactionThunkState = WalletSettingsRootState & BlockchainRootState;

export const signRippleStellarSendFormTransactionThunk = createThunk<
    { serializedTx: string },
    SignTransactionThunkArguments,
    {
        rejectValue: SignTransactionError;
        state: SignRippleStellarSendFormTransactionThunkState;
    }
>(
    `${SEND_MODULE_PREFIX}/signRippleStellarSendFormTransactionThunk`,
    async (
        { formState, precomposedTransaction, selectedAccount, device, paymentRequests },
        { getState, rejectWithValue },
    ) => {
        const send = getSend(selectedAccount, getState);

        if (!send) {
            return rejectWithValue({
                error: 'sign-transaction-failed',
                message: 'Invalid network type.',
            });
        }

        const addressDisplayType = selectAddressDisplayType(getState());

        try {
            const { serializedTx } = await send.sign({
                account: selectedAccount,
                draft: formState,
                precomposed: precomposedTransaction,
                options: {
                    device: toChainSendDevice(device),
                    chunkify: addressDisplayType === AddressDisplayOptions.CHUNKED,
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
