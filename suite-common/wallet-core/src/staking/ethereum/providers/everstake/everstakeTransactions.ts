import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type StakeType, type WalletAccountTransaction } from '@suite-common/wallet-types';
import { isPending } from '@suite-common/wallet-utils';
import { type InternalTransfer } from '@trezor/connect';

import { getEverstakeContractsBySymbol } from './everstakeContracts';

export const getInstantStakeType = (
    internalTransfer: Pick<InternalTransfer, 'from' | 'to'>,
    address?: string,
    symbol?: NetworkSymbol,
): StakeType | null => {
    if (!address || !symbol) return null;

    const contracts = getEverstakeContractsBySymbol(symbol);
    if (!contracts) return null;

    const { from, to } = internalTransfer;
    const { pool, withdrawTreasury } = contracts;

    if (from === pool && to === withdrawTreasury) return 'stake';
    if (from === pool && to === address) return 'unstake';
    if (from === withdrawTreasury && to === address) return 'claim';

    return null;
};

export const getChangedInternalTx = (
    prevTxs: WalletAccountTransaction[],
    currentTxs: WalletAccountTransaction[],
    selectedAccountAddress?: string,
    symbol?: NetworkSymbol,
): InternalTransfer | null => {
    if (!selectedAccountAddress || !symbol) return null;

    const prevPendingTxs = prevTxs.filter(tx => isPending(tx));
    const currentSentTxs = currentTxs.filter(
        tx => tx.type === 'sent' && tx.internalTransfers.length > 0,
    );

    const changedTx = currentSentTxs.find(currTx =>
        prevPendingTxs.some(prevTx => currTx.txid === prevTx.txid),
    );

    if (!changedTx) return null;

    const internalTransfer = changedTx.internalTransfers.find(internalTx =>
        getInstantStakeType(internalTx, selectedAccountAddress, symbol),
    );

    return internalTransfer ?? null;
};
