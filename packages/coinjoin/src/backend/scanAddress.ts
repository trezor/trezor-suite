import { transformTransaction } from '@trezor/blockchain-link/lib/workers/blockbook/utils';

import { getAddressScript, getFilter } from './filters';
import { doesTxContainAddress, fixTx } from './backendUtils';
import type {
    ScanAddressParams,
    ScanAddressCheckpoint,
    ScanAddressContext,
    ScanAddressResult,
} from '../types/backend';

export const scanAddress = async (
    params: ScanAddressParams & { checkpoints: ScanAddressCheckpoint[] },
    { client, network, filters, mempool, abortSignal, onProgress }: ScanAddressContext,
): Promise<ScanAddressResult> => {
    const address = params.descriptor;
    const script = getAddressScript(address, network);
    const { checkpoints } = params;
    let checkpoint = checkpoints[0];

    const everyFilter = filters.getFilterIterator({ checkpoints }, { abortSignal });
    // eslint-disable-next-line no-restricted-syntax
    for await (const { filter, blockHash, blockHeight, progress } of everyFilter) {
        checkpoint = { blockHash, blockHeight };
        const isMatch = getFilter(filter, blockHash);
        if (isMatch(script)) {
            const block = await client.fetchBlock(blockHeight);
            const blockTxs = block.txs.filter(doesTxContainAddress(address));
            const transactions = blockTxs.map(tx => transformTransaction(address, undefined, tx));

            await fixTx(transactions, client, network);

            onProgress({
                checkpoint,
                transactions,
                info: { progress },
            });
        }
    }

    await mempool.update();

    const pending = mempool
        .getTransactions([address])
        .map(tx => transformTransaction(address, undefined, tx));

    return {
        pending,
        checkpoint,
    };
};
