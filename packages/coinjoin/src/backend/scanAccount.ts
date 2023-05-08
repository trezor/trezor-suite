import { transformTransaction } from '@trezor/blockchain-link-utils/lib/blockbook';

import { getBlockFilter } from './filters';
import { doesTxContainAddress } from './backendUtils';
import { CoinjoinAddressController } from './CoinjoinAddressController';
import type {
    Transaction,
    AccountAddress,
    BlockbookBlock,
    BlockbookTransaction,
    ScanAccountParams,
    ScanAccountCheckpoint,
    ScanAccountContext,
    ScanAccountResult,
} from '../types/backend';
import { DISCOVERY_LOOKOUT, DISCOVERY_LOOKOUT_EXTENDED } from '../constants';

const transformTx =
    (xpub: string, receive: AccountAddress[], change: AccountAddress[]) =>
    (tx: BlockbookTransaction) =>
        // It doesn't matter for transformTransaction which receive addrs are used and which are unused
        transformTransaction(xpub, { used: receive, unused: [], change }, tx);

export const scanAccount = async (
    params: ScanAccountParams & { checkpoints: ScanAccountCheckpoint[] },
    { client, network, filters, mempool, abortSignal, onProgress }: ScanAccountContext,
): Promise<ScanAccountResult> => {
    const xpub = params.descriptor;
    const { checkpoints } = params;

    const receive = new CoinjoinAddressController(
        xpub,
        'receive',
        DISCOVERY_LOOKOUT,
        network,
        checkpoints[0].receiveCount,
        params.cache?.receivePrederived,
    );

    const change = new CoinjoinAddressController(
        xpub,
        'change',
        DISCOVERY_LOOKOUT_EXTENDED,
        network,
        checkpoints[0].changeCount,
        params.cache?.changePrederived,
    );

    let checkpoint = checkpoints[0];

    const txs = new Set<BlockbookTransaction>();

    const everyFilter = filters.getFilterIterator({ checkpoints }, { abortSignal });
    // eslint-disable-next-line no-restricted-syntax
    for await (const { filter, blockHash, blockHeight, progress } of everyFilter) {
        const isMatch = getBlockFilter(filter, blockHash);

        let block: BlockbookBlock | undefined;
        const findTxs = async ({ script, address }: AccountAddress) => {
            if (isMatch(script)) {
                if (!block) {
                    block = await client.fetchBlock(blockHeight, { signal: abortSignal });
                }
                return block.txs.filter(doesTxContainAddress(address));
            }
            return [];
        };

        const onTxs = (transactions: BlockbookTransaction[]) => transactions.forEach(txs.add, txs);

        await receive.analyze(findTxs, onTxs);
        await change.analyze(findTxs, onTxs);

        const transactions = Array.from(
            txs,
            transformTx(xpub, receive.addresses, change.addresses),
        );
        checkpoint = {
            blockHash,
            blockHeight,
            receiveCount: receive.addresses.length,
            changeCount: change.addresses.length,
        };

        txs.clear();

        if (progress !== undefined) {
            onProgress({ checkpoint, transactions, info: { progress } });
        } else if (transactions.length) {
            onProgress({ checkpoint, transactions });
        }
    }

    let pending: Transaction[] = [];
    if (mempool) {
        if (mempool.status === 'stopped') {
            await mempool.start();
            pending = await mempool
                .init(receive, change)
                .then(transactions =>
                    transactions.map(transformTx(xpub, receive.addresses, change.addresses)),
                );
        } else {
            await mempool.update();
            pending = mempool
                .getTransactions(receive, change)
                .map(transformTx(xpub, receive.addresses, change.addresses));
        }

        checkpoint.receiveCount = receive.addresses.length;
        checkpoint.changeCount = change.addresses.length;
    }

    const cache = {
        receivePrederived: receive.addresses.map(({ address, path }) => ({ address, path })),
        changePrederived: change.addresses.map(({ address, path }) => ({ address, path })),
    };

    return {
        pending,
        checkpoint,
        cache,
    };
};
