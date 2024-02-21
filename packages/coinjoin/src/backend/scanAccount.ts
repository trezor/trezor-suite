import { createCooldown } from '@trezor/utils';
import { blockbookUtils } from '@trezor/blockchain-link-utils';

import { getMultiFilter } from './filters';
import { doesTxContainAddress } from './backendUtils';
import { CoinjoinAddressController } from './CoinjoinAddressController';
import type {
    Transaction,
    BlockbookTransaction,
    ScanAccountParams,
    ScanAccountCheckpoint,
    ScanAccountContext,
    ScanAccountResult,
} from '../types/backend';
import { CHECKPOINT_COOLDOWN } from '../constants';

const transformTx =
    ({ receive, change }: CoinjoinAddressController) =>
    (tx: BlockbookTransaction) =>
        // It doesn't matter for transformTransaction which receive addrs are used and which are unused
        blockbookUtils.transformTransaction(tx, { used: receive, unused: [], change });

export const scanAccount = async (
    params: ScanAccountParams & { checkpoints: ScanAccountCheckpoint[] },
    {
        client,
        network,
        filters,
        mempool,
        abortSignal,
        onProgress,
        onProgressInfo,
    }: ScanAccountContext,
): Promise<ScanAccountResult> => {
    const xpub = params.descriptor;
    const { checkpoints } = params;

    const addresses = new CoinjoinAddressController(xpub, network, checkpoints[0], params.cache);

    let [checkpoint] = checkpoints;
    const checkpointCooldown = createCooldown(CHECKPOINT_COOLDOWN);

    const txs = new Set<BlockbookTransaction>();

    const everyFilter = filters.getFilterIterator({ checkpoints }, { abortSignal, onProgressInfo });

    for await (const { blockHash, blockHeight, filter, filterParams } of everyFilter) {
        const isMatch = getMultiFilter(filter, filterParams);
        const scripts = addresses.receive.concat(addresses.change).map(({ script }) => script);

        if (isMatch(scripts)) {
            const block = await client.fetchBlock(blockHeight, { signal: abortSignal });
            if (mempool?.status === 'running') {
                mempool.removeTransactions(block.txs.map(({ txid }) => txid));
            }
            addresses.analyze(
                ({ address }) => block.txs.filter(doesTxContainAddress(address)),
                transactions => transactions.forEach(txs.add, txs),
            );
        }

        const transactions = Array.from(txs, transformTx(addresses));
        checkpoint = {
            blockHash,
            blockHeight,
            receiveCount: addresses.receive.length,
            changeCount: addresses.change.length,
        };

        txs.clear();

        if (checkpointCooldown() || transactions.length) {
            onProgress({ checkpoint, transactions });
        }
    }

    let pending: Transaction[] = [];
    if (mempool) {
        if (mempool.status === 'stopped') {
            await mempool.start();
            pending = await mempool
                .init(addresses, onProgressInfo)
                .then(transactions => transactions.map(transformTx(addresses)))
                .catch(err => {
                    mempool.stop();
                    throw err;
                });
        } else {
            await mempool.update();
            pending = mempool.getTransactions(addresses).map(transformTx(addresses));
        }

        checkpoint = {
            ...checkpoint,
            receiveCount: addresses.receive.length,
            changeCount: addresses.change.length,
        };
    }

    const cache = {
        receivePrederived: addresses.receive.map(({ address, path }) => ({ address, path })),
        changePrederived: addresses.change.map(({ address, path }) => ({ address, path })),
    };

    return {
        pending,
        checkpoint,
        cache,
    };
};
