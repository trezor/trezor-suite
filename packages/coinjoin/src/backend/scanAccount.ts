import { deriveAddresses } from '@trezor/utxo-lib';
import { transformTransaction } from '@trezor/blockchain-link/lib/workers/blockbook/utils';

import { getAddressScript, getFilter } from './filters';
import { doesTxContainAddress, fixTxInputs } from './backendUtils';
import type {
    AccountAddress,
    BlockbookBlock,
    BlockbookTransaction,
    ScanAccountParams,
    ScanAccountCheckpoint,
    ScanAccountContext,
    ScanAccountResult,
} from '../types/backend';
import { DISCOVERY_LOOKOUT } from '../constants';

const transformTx =
    (xpub: string, receive: AccountAddress[], change: AccountAddress[]) =>
    (tx: BlockbookTransaction) =>
        // It doesn't matter for transformTransaction which receive addrs are used and which are unused
        transformTransaction(xpub, { used: receive, unused: [], change }, tx);

const analyzeAddresses = async (
    addresses: AccountAddress[],
    isMatch: (script: Buffer) => boolean,
    getBlock: () => Promise<BlockbookBlock>,
    deriveMore: (from: number, count: number) => AccountAddress[],
    txs: Set<BlockbookTransaction>,
    lookout = DISCOVERY_LOOKOUT,
): Promise<AccountAddress[]> => {
    let addrs = addresses;
    for (let i = 0; i < addrs.length; ++i) {
        const { address, script } = addrs[i];
        if (isMatch(script)) {
            // eslint-disable-next-line no-await-in-loop
            const block = await getBlock();
            const transactions = block.txs.filter(doesTxContainAddress(address));
            if (transactions.length) {
                transactions.forEach(txs.add, txs);
                const missing = lookout + i + 1 - addrs.length;
                if (missing > 0) {
                    addrs = addrs.concat(deriveMore(addrs.length, missing));
                }
            }
        }
    }
    return addrs;
};

export const scanAccount = async (
    params: ScanAccountParams & { checkpoint: ScanAccountCheckpoint },
    { client, network, filters, mempool, abortSignal, onProgress }: ScanAccountContext,
): Promise<ScanAccountResult> => {
    const xpub = params.descriptor;
    const deriveMore = (type: 'receive' | 'change') => (from: number, count: number) =>
        deriveAddresses(xpub, type, from, count, network).map(({ address }) => ({
            address,
            script: getAddressScript(address, network),
        }));

    let { checkpoint } = params;
    let receive: AccountAddress[] = deriveMore('receive')(0, checkpoint.receiveCount);
    let change: AccountAddress[] = deriveMore('change')(0, checkpoint.changeCount);

    let firstBlockHeight = -1;

    const txs = new Set<BlockbookTransaction>();

    const everyFilter = filters.getFilterIterator(
        { fromHash: checkpoint.blockHash },
        { abortSignal },
    );
    // eslint-disable-next-line no-restricted-syntax
    for await (const { filter, blockHash, blockHeight } of everyFilter) {
        if (firstBlockHeight < 0) firstBlockHeight = blockHeight;

        const isMatch = getFilter(filter, blockHash);

        let block: BlockbookBlock | undefined;
        const lazyBlock = async () =>
            block ?? (block = await client.fetchBlock(blockHeight, { signal: abortSignal }));

        receive = await analyzeAddresses(receive, isMatch, lazyBlock, deriveMore('receive'), txs);
        change = await analyzeAddresses(change, isMatch, lazyBlock, deriveMore('change'), txs);

        const transactions = Array.from(txs, transformTx(xpub, receive, change));
        const progress =
            (blockHeight - firstBlockHeight) / (filters.bestBlockHeight - firstBlockHeight);
        checkpoint = {
            blockHash,
            blockHeight,
            receiveCount: receive.length,
            changeCount: change.length,
        };

        txs.clear();

        await fixTxInputs(transactions, client);

        onProgress({
            checkpoint,
            transactions,
            info: {
                progress,
            },
        });
    }

    await mempool.update();

    const pending = mempool
        .getTransactions(receive.concat(change).map(({ address }) => address))
        .map(transformTx(xpub, receive, change));

    await fixTxInputs(pending, client);

    return {
        pending,
        checkpoint,
    };
};
