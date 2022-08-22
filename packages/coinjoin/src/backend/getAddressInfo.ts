import { transformTransaction } from '@trezor/blockchain-link/lib/workers/blockbook/utils';
import { sortTxsFromLatest } from '@trezor/blockchain-link/lib/workers/electrum/methods/getAccountInfo';

import { getAddressScript, getFilter } from './filters';
import { calculateBalance, getPagination, doesTxContainAddress, isTxConfirmed } from './utils';
import type {
    AccountInfo,
    MethodContext,
    DiscoveryContext,
    GetAccountInfoParams,
    KnownState,
    DiscoveryCheckpoint,
    BlockbookTransaction,
} from './types';

export const getAddressInfo = async (
    { descriptor: address, knownState }: GetAccountInfoParams & { knownState: KnownState },
    { client, network, controller, mempool, abortSignal }: MethodContext & DiscoveryContext,
): Promise<AccountInfo & DiscoveryCheckpoint> => {
    const script = getAddressScript(address, network);
    let txs: BlockbookTransaction[] = [];

    let lastBlockHash = knownState.blockHash;
    const everyFilter = controller.getFilterIterator(
        { fromHash: knownState.blockHash },
        { abortSignal },
    );
    // eslint-disable-next-line no-restricted-syntax
    for await (const { filter, blockHash, blockHeight } of everyFilter) {
        lastBlockHash = blockHash;
        const isMatch = getFilter(filter, blockHash);
        if (isMatch(script)) {
            const block = await client.fetchBlock(blockHeight);
            const blockTxs = block.txs.filter(doesTxContainAddress(address));
            txs = txs.concat(blockTxs);
        }
    }

    await mempool.update();

    const pendingTxs = mempool.getTransactions([address]);

    const transactions = txs
        .concat(pendingTxs)
        .map(tx => transformTransaction(address, undefined, tx))
        .concat(knownState.transactions.filter(isTxConfirmed))
        .sort(sortTxsFromLatest);
    const txCount = transactions.length;
    const txCountConfirmed = txCount - pendingTxs.length;
    const [balanceConfirmed, balanceUnconfirmed] = calculateBalance(transactions);

    return {
        descriptor: address,
        balance: balanceConfirmed.toString(),
        availableBalance: (balanceConfirmed + balanceUnconfirmed).toString(),
        empty: !txCount,
        history: {
            total: txCountConfirmed,
            unconfirmed: txCount - txCountConfirmed,
            transactions,
        },
        page: getPagination(txs.length),
        checkpoint: {
            time: Date.now(),
            blockHash: lastBlockHash,
        },
    };
};
