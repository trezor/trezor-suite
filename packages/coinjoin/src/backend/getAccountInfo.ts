import { deriveAddresses } from '@trezor/utxo-lib';
import { countUnusedFromEnd } from '@trezor/utxo-lib/lib/discovery';
import {
    sortTxsFromLatest,
    sumAddressValues,
} from '@trezor/blockchain-link/lib/workers/electrum/methods/getAccountInfo';
import { transformTransaction } from '@trezor/blockchain-link/lib/workers/blockbook/utils';

import { getAddressScript, getFilter } from './filters';
import { calculateBalance, getPagination, doesTxContainAddress, isTxConfirmed } from './utils';
import type {
    Address,
    AccountInfo,
    AccountAddressTxs,
    AccountAddressLightTxs,
    BlockbookBlock,
    DiscoveryContext,
    DiscoveryCheckpoint,
    GetAccountInfoParams,
    KnownState,
    LightTx,
    MethodContext,
} from './types';

const DISCOVERY_LOOKOUT = 20;

const getTransactionFetcher =
    (isMatch: (script: Buffer) => boolean, fetchBlock: () => Promise<BlockbookBlock>) =>
    async (addresses: AccountAddressTxs[]) => {
        const firstMatch = addresses.map(({ script }) => script).findIndex(isMatch);
        if (firstMatch < 0) return addresses;
        const { txs } = await fetchBlock();
        return addresses.map((address, index) =>
            index < firstMatch || !isMatch(address.script)
                ? address
                : {
                      ...address,
                      txs: address.txs.concat(txs.filter(doesTxContainAddress(address.address))),
                  },
        );
    };

const analyzeAddresses = async (
    addresses: AccountAddressTxs[],
    fetchTxs: (addresses: AccountAddressTxs[]) => Promise<AccountAddressTxs[]>,
    deriveMore: (from: number, count: number) => AccountAddressTxs[],
    lookout = DISCOVERY_LOOKOUT,
): Promise<AccountAddressTxs[]> => {
    let result = await fetchTxs(addresses);
    let unused = countUnusedFromEnd(result, a => !a.txs.length, lookout);
    while (unused < lookout) {
        const missingCount = lookout - unused;
        // eslint-disable-next-line no-await-in-loop
        const missing = await fetchTxs(deriveMore(result.length, missingCount));
        result = result.concat(missing);
        unused = countUnusedFromEnd(result, a => !a.txs.length, lookout);
    }
    return result;
};

const transformAddressInfo = ({ address, path, txs }: AccountAddressLightTxs): Address => {
    const sent = sumAddressValues(txs, address, tx => tx.vin);
    const received = sumAddressValues(txs, address, tx => tx.vout);
    return {
        address,
        path,
        transfers: txs.length,
        balance: txs.length ? (received - sent).toString() : undefined,
        sent: txs.length ? sent.toString() : undefined,
        received: txs.length ? received.toString() : undefined,
    };
};

const mergeTxs =
    (transactions: LightTx[]) =>
    ({ address, txs, ...rest }: AccountAddressLightTxs) => ({
        address,
        txs: txs.concat(transactions.filter(doesTxContainAddress(address))),
        ...rest,
    });

export const getAccountInfo = async (
    { descriptor: xpub, knownState }: GetAccountInfoParams & { knownState: KnownState },
    {
        client,
        network,
        controller,
        mempool,
        abortSignal,
        onProgress,
    }: MethodContext & DiscoveryContext,
): Promise<AccountInfo & DiscoveryCheckpoint> => {
    onProgress({ message: 'Filtering and fetching', progress: 0 });

    const deriveMore = (type: 'receive' | 'change') => (from: number, count: number) =>
        deriveAddresses(xpub, type, from, count, network).map(({ address, path }) => ({
            address,
            path,
            script: getAddressScript(address, network),
            txs: [],
        }));

    let receive: AccountAddressTxs[] = deriveMore('receive')(0, knownState.receiveCount);
    let change: AccountAddressTxs[] = deriveMore('change')(0, knownState.changeCount);

    let lastBlockHash = knownState.blockHash;
    let firstBlockHeight = -1;

    const everyFilter = controller.getFilterIterator(
        { fromHash: knownState.blockHash },
        { abortSignal },
    );
    // eslint-disable-next-line no-restricted-syntax
    for await (const { filter, blockHash, blockHeight } of everyFilter) {
        lastBlockHash = blockHash;
        if (firstBlockHeight < 0) firstBlockHeight = blockHeight;
        const progress =
            (blockHeight - firstBlockHeight) / (controller.bestBlockHeight - firstBlockHeight);

        onProgress({ message: 'Filtering and fetching', progress });

        const isMatch = getFilter(filter, blockHash);
        const fetchBlock = () => client.fetchBlock(blockHeight, { signal: abortSignal });
        const fetchTxs = getTransactionFetcher(isMatch, fetchBlock);

        receive = await analyzeAddresses(receive, fetchTxs, deriveMore('receive'));
        change = await analyzeAddresses(change, fetchTxs, deriveMore('change'));
    }

    onProgress({ message: 'Synchronizing mempool' });

    await mempool.update();

    onProgress({ message: 'Transforming' });

    const knownConfirmedTxs = knownState.transactions.filter(isTxConfirmed);
    const prevTxs = knownConfirmedTxs.map(tx => ({
        vin: tx.details.vin,
        vout: tx.details.vout,
    }));

    const receiveTxs = receive.map(mergeTxs(prevTxs));
    const changeTxs = change.map(mergeTxs(prevTxs));

    const addresses = {
        change: changeTxs.map(transformAddressInfo),
        unused: receiveTxs.filter(({ txs }) => !txs.length).map(transformAddressInfo),
        used: receiveTxs.filter(({ txs }) => txs.length).map(transformAddressInfo),
    };

    const pendingTxs = mempool.getTransactions(
        receive.concat(change).map(({ address }) => address),
    );

    const transactions = receive
        .concat(change)
        .flatMap(({ txs }) => txs)
        .filter((item, index, self) => self.findIndex(it => it.txid === item.txid) === index)
        .concat(pendingTxs)
        .map(tx => transformTransaction(xpub, addresses, tx))
        .concat(knownConfirmedTxs)
        .sort(sortTxsFromLatest);
    const [balanceConfirmed, balanceUnconfirmed] = calculateBalance(transactions);
    const txCount = transactions.length;
    const txCountConfirmed = txCount - pendingTxs.length;

    onProgress({ message: 'Done' });

    return {
        descriptor: xpub,
        balance: balanceConfirmed.toString(),
        availableBalance: (balanceConfirmed + balanceUnconfirmed).toString(),
        empty: !txCount,
        history: {
            total: txCountConfirmed,
            unconfirmed: txCount - txCountConfirmed,
            transactions,
        },
        addresses,
        page: getPagination(transactions.length),
        checkpoint: {
            time: Date.now(),
            blockHash: lastBlockHash,
        },
    };
};
