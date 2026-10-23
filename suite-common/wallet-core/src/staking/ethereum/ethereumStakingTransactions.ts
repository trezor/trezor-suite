import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type WalletAccountTransaction } from '@suite-common/wallet-types';
import { isPending } from '@suite-common/wallet-utils';
import { type InternalTransfer } from '@trezor/blockchain-link-types';

import { listEthereumStakingAdapters } from './providers/ethereumStakingProviders';
import {
    type EthereumStakingProductAdapter,
    type StakingTransferAccount,
    type StakingTransferClassification,
    type StakingTxClassification,
} from './providers/types';

const firstHit = <T>(
    adapters: EthereumStakingProductAdapter[],
    classify: (adapter: EthereumStakingProductAdapter) => T | null,
): T | null => {
    for (const adapter of adapters) {
        const hit = classify(adapter);
        if (hit) return hit;
    }

    return null;
};

export const classifyEthereumStakingTransaction = (
    tx: WalletAccountTransaction,
): StakingTxClassification | null =>
    tx.ethereumSpecific
        ? firstHit(listEthereumStakingAdapters(tx.symbol), adapter =>
              adapter.classifyTransaction(tx),
          )
        : null;

export const classifyEthereumStakingCalldata = (
    symbol: NetworkSymbol,
    data: string | undefined,
): StakingTxClassification | null =>
    firstHit(listEthereumStakingAdapters(symbol), adapter =>
        adapter.classifyCalldata(data, symbol),
    );

export const classifyEthereumInternalTransfer = (
    transfer: Pick<InternalTransfer, 'from' | 'to'>,
    account: StakingTransferAccount,
): StakingTransferClassification | null =>
    firstHit(listEthereumStakingAdapters(account.symbol), adapter =>
        adapter.classifyInternalTransfer(transfer, account),
    );

// An instant stake moves funds from the pool to the provider's treasury; it is not a transfer of
// the account and stays out of its targets.
export const isEthereumInternalTransferHidden = (
    transfer: Pick<InternalTransfer, 'from' | 'to'>,
    account: StakingTransferAccount,
) => classifyEthereumInternalTransfer(transfer, account)?.type === 'stake';

// The internal transfer of a transaction that just confirmed and settled a staking operation
// instantly, if any; used to announce the instant part of a stake or unstake.
export const findChangedEthereumStakingInternalTransfer = (
    prevTxs: WalletAccountTransaction[],
    currentTxs: WalletAccountTransaction[],
    account: StakingTransferAccount,
): InternalTransfer | null => {
    const prevPendingTxs = prevTxs.filter(tx => isPending(tx));
    const currentSentTxs = currentTxs.filter(
        tx => tx.type === 'sent' && tx.internalTransfers.length > 0,
    );

    const changedTx = currentSentTxs.find(currTx =>
        prevPendingTxs.some(prevTx => currTx.txid === prevTx.txid),
    );

    if (!changedTx) return null;

    const internalTransfer = changedTx.internalTransfers.find(transfer =>
        classifyEthereumInternalTransfer(transfer, account),
    );

    return internalTransfer ?? null;
};
