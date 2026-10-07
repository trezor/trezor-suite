import {
    type DeviceRootState,
    isApprovalFlowSupported,
    selectSelectedDevice,
} from '@suite-common/device';
import { datetimeToLocktime, resolveStellarContractId } from '@suite-common/wallet-utils';
import type { BitcoinSendAppDeps } from '@trezor/network-bitcoin-suite-common';
import type { EvmSendAppDeps } from '@trezor/network-ethereum-suite-common';
import { type ChainSendAccount, ChainSendError } from '@trezor/network-module-suite-common-types';
import type { SolanaSendAppDeps } from '@trezor/network-solana-suite-common';
import type { StellarSendAppDeps } from '@trezor/network-stellar-suite-common';

import { handleEvmFeeEstimationFailure } from './reportEthereumFeeEstimationError';
import { ethereumGetCurrentNonceThunk } from './sendFormEthereumThunks';
import { type AccountsRootState } from '../accounts/accountsReducer';
import { selectAccounts } from '../accounts/accountsSelectors';
import {
    type BlockchainRootState,
    selectBlockchainBlockInfoBySymbol,
} from '../blockchain/blockchainReducer';
import { selectBlockchainUrl } from '../blockchain/blockchainSelectors';
import { type TransactionsRootState } from '../transactions/transactionsReducerTypes';
import { selectEvmPrivatePendingHint } from '../transactions/transactionsSelectors';

export type WalletChainSendDepsState = AccountsRootState &
    TransactionsRootState &
    DeviceRootState &
    BlockchainRootState;

export type CreateWalletChainSendDepsParams = {
    dispatch: (action: any) => any;
    getState: () => WalletChainSendDepsState;
};

export type WalletChainSendDeps = BitcoinSendAppDeps &
    EvmSendAppDeps &
    SolanaSendAppDeps &
    StellarSendAppDeps;

/**
 * What chain networks need to send that only the wallet knows, read from the Redux store: the
 * accounts' known transactions, the selected device, the connected backends, the user's input.
 */
export const createWalletChainSendDeps = ({
    dispatch,
    getState,
}: CreateWalletChainSendDepsParams): WalletChainSendDeps => {
    const getWalletAccount = (account: ChainSendAccount) =>
        selectAccounts(getState()).find(
            walletAccount =>
                walletAccount.descriptor === account.descriptor &&
                walletAccount.symbol === account.symbol &&
                walletAccount.deviceState === account.deviceState,
        );

    return {
        datetimeToLocktime,
        getStellarBackendUrl: symbol => selectBlockchainUrl(getState(), symbol),
        resolveStellarContractId,
        getSolanaBlockInfo: symbol => {
            const { blockhash, blockHeight } = selectBlockchainBlockInfoBySymbol(
                getState(),
                symbol,
            );

            return { blockHash: blockhash, blockHeight };
        },
        isApprovalFlowSupported: () => isApprovalFlowSupported(selectSelectedDevice(getState())),
        getEvmPrivatePendingHint: account => {
            const walletAccount = getWalletAccount(account);

            return walletAccount
                ? selectEvmPrivatePendingHint(getState(), walletAccount.key)
                : undefined;
        },
        resolveEvmNonce: ({ account, rbfParams, fetchConfirmedNonce }) => {
            const walletAccount = getWalletAccount(account);

            if (walletAccount?.networkType !== 'ethereum') {
                throw new ChainSendError('sign-failed', account.symbol, 'Account not found.');
            }

            return dispatch(
                ethereumGetCurrentNonceThunk({
                    selectedAccount: walletAccount,
                    rbfParams,
                    fetchConfirmedNonce,
                }),
            ).unwrap();
        },
        onEvmFeeEstimationFailed: failure => {
            const walletAccount = getWalletAccount(failure.account);
            if (walletAccount) handleEvmFeeEstimationFailure(dispatch, walletAccount, failure);
        },
    };
};
