import {
    type DeviceRootState,
    isApprovalFlowSupported,
    selectSelectedDevice,
} from '@suite-common/device';
import { datetimeToLocktime, resolveStellarContractId } from '@suite-common/wallet-utils';
import type { BitcoinSendAppDeps } from '@trezor/network-bitcoin-suite-common';
import type { EvmSendAppDeps } from '@trezor/network-ethereum-suite-common';
import type { ChainSendAccount } from '@trezor/network-module-suite-common-types';
import type { SolanaSendAppDeps } from '@trezor/network-solana-suite-common';
import type { StellarSendAppDeps } from '@trezor/network-stellar-suite-common';

import { handleEvmFeeEstimationFailure } from './reportEthereumFeeEstimationError';
import { isEvmTokenDefinitionKnown, isSolanaTokenDefinitionKnown } from './tokenDefinitions';
import { type AccountsRootState } from '../accounts/accountsReducer';
import { selectAccounts } from '../accounts/accountsSelectors';
import {
    type BlockchainRootState,
    selectBlockchainBlockInfoBySymbol,
} from '../blockchain/blockchainReducer';
import { selectBlockchainUrl } from '../blockchain/blockchainSelectors';
import { type TransactionsRootState } from '../transactions/transactionsReducerTypes';
import { selectTransactions } from '../transactions/transactionsSelectors';

export type WalletChainSendDepsState = AccountsRootState &
    TransactionsRootState &
    DeviceRootState &
    BlockchainRootState;

export type CreateWalletChainSendDepsParams = {
    dispatch: (action: any) => any;
    getState: () => WalletChainSendDepsState;
};

// EVM networks resolve the nonce themselves, from their backend and the pending sends.
export type WalletChainSendDeps = BitcoinSendAppDeps &
    Omit<EvmSendAppDeps, 'resolveEvmNonce' | 'getEvmPrivatePendingHint'> &
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
        getAccountTransactions: account => {
            const walletAccount = getWalletAccount(account);

            return walletAccount ? (selectTransactions(getState())[walletAccount.key] ?? []) : [];
        },
        getStellarBackendUrl: symbol => selectBlockchainUrl(getState(), symbol),
        resolveStellarContractId,
        isEvmTokenDefinitionKnown,
        isSolanaTokenDefinitionKnown,
        getSolanaBlockInfo: symbol => {
            const { blockhash, blockHeight } = selectBlockchainBlockInfoBySymbol(
                getState(),
                symbol,
            );

            return { blockHash: blockhash, blockHeight };
        },
        isApprovalFlowSupported: () => isApprovalFlowSupported(selectSelectedDevice(getState())),
        onEvmFeeEstimationFailed: failure => {
            const walletAccount = getWalletAccount(failure.account);
            if (walletAccount) handleEvmFeeEstimationFailure(dispatch, walletAccount, failure);
        },
    };
};
