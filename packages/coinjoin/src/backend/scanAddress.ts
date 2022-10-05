import { transformTransaction } from '@trezor/blockchain-link/lib/workers/blockbook/utils';

import { getAddressScript, getFilter } from './filters';
import { doesTxContainAddress, fixTxInputs } from './backendUtils';
import type {
    ScanAddressParams,
    ScanAddressCheckpoint,
    ScanAddressContext,
    ScanAddressResult,
} from '../types/backend';

export const scanAddress = async (
    params: ScanAddressParams & { checkpoint: ScanAddressCheckpoint },
    { client, network, filters, mempool, abortSignal, onProgress }: ScanAddressContext,
): Promise<ScanAddressResult> => {
    const address = params.descriptor;
    const script = getAddressScript(address, network);
    let { checkpoint } = params;

    const everyFilter = filters.getFilterIterator(
        { fromHash: checkpoint.blockHash },
        { abortSignal },
    );
    // eslint-disable-next-line no-restricted-syntax
    for await (const { filter, blockHash, blockHeight } of everyFilter) {
        checkpoint = { blockHash, blockHeight };
        const isMatch = getFilter(filter, blockHash);
        if (isMatch(script)) {
            const block = await client.fetchBlock(blockHeight);
            const blockTxs = block.txs.filter(doesTxContainAddress(address));
            const transactions = blockTxs.map(tx => transformTransaction(address, undefined, tx));

            await fixTxInputs(transactions, client);

            onProgress({
                checkpoint,
                transactions,
            });
        }
    }

    await mempool.update();

    const pending = mempool
        .getTransactions([address])
        .map(tx => transformTransaction(address, undefined, tx));

    await fixTxInputs(pending, client);

    return {
        pending,
        checkpoint,
    };
};
