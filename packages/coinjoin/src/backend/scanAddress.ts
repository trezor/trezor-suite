import { transformTransaction } from '@trezor/blockchain-link-utils/lib/blockbook';

import { getBlockAddressScript, getBlockFilter } from './filters';
import { doesTxContainAddress } from './backendUtils';
import type {
    Transaction,
    ScanAddressParams,
    ScanAddressCheckpoint,
    ScanAddressContext,
    ScanAddressResult,
} from '../types/backend';
import { AddressController } from './CoinjoinAddressController';

const getAddressController = (address: string): AddressController => ({
    addresses: [{ address }],
    analyze: async (findTxs, onTxs) => {
        const txs = findTxs({ address });
        onTxs?.('then' in txs ? await txs : txs);
    },
});

export const scanAddress = async (
    params: ScanAddressParams & { checkpoints: ScanAddressCheckpoint[] },
    { client, network, filters, mempool, abortSignal, onProgress }: ScanAddressContext,
): Promise<ScanAddressResult> => {
    const address = params.descriptor;
    const script = getBlockAddressScript(address, network);
    const { checkpoints } = params;
    let checkpoint = checkpoints[0];

    const everyFilter = filters.getFilterIterator({ checkpoints }, { abortSignal });
    // eslint-disable-next-line no-restricted-syntax
    for await (const { filter, blockHash, blockHeight, progress } of everyFilter) {
        checkpoint = { blockHash, blockHeight };
        const isMatch = getBlockFilter(filter, blockHash);
        if (isMatch(script)) {
            const block = await client.fetchBlock(blockHeight);
            const blockTxs = block.txs.filter(doesTxContainAddress(address));
            const transactions = blockTxs.map(tx => transformTransaction(address, undefined, tx));

            onProgress({
                checkpoint,
                transactions,
                info: { progress },
            });
        }
    }

    let pending: Transaction[] = [];
    const addressController = getAddressController(address);

    if (mempool) {
        if (mempool.status === 'stopped') {
            await mempool.start();
            pending = await mempool
                .init(addressController)
                .then(transactions =>
                    transactions.map(tx => transformTransaction(address, undefined, tx)),
                );
        } else {
            await mempool.update();
            pending = mempool
                .getTransactions(addressController)
                .map(tx => transformTransaction(address, undefined, tx));
        }
    }

    return {
        pending,
        checkpoint,
    };
};
