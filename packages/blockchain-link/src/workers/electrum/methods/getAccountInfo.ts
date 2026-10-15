import type {
    Address,
    ElectrumAPI,
    ElectrumHistoryTx as HistoryTx,
    MessageTypes,
    ResponseTypes,
    VinVout,
} from '@trezor/blockchain-link-types';
import { sortTxsFromLatest } from '@trezor/blockchain-link-utils';
import { createTransactionTransformer } from '@trezor/blockchain-link-utils/src/blockbook';
import { discovery } from '@trezor/utxo-lib';

import {
    type AddressHistory,
    type Api,
    discoverAddress,
    getTransactions,
    tryGetScripthash,
} from '../utils';

const PAGE_SIZE_DEFAULT = 25;

type Req = MessageTypes.GetAccountInfo;
type Res = ResponseTypes.GetAccountInfo;

type AddressInfo = Omit<AddressHistory, 'scripthash'> & {
    confirmed: number;
    unconfirmed: number;
};

const getBalances =
    (client: ElectrumAPI) =>
    (addresses: AddressHistory[]): Promise<AddressInfo[]> =>
        Promise.all(
            addresses.map(async ({ address, path, history, scripthash, empty }) => {
                const { confirmed, unconfirmed } = history.length
                    ? await client.request('blockchain.scripthash.get_balance', scripthash)
                    : {
                          confirmed: 0,
                          unconfirmed: 0,
                      };

                return {
                    address,
                    path,
                    history,
                    empty,
                    confirmed,
                    unconfirmed,
                };
            }),
        );

type PageParams = {
    page: number;
    pageSize: number;
};

const getPagination = (history: HistoryTx[], { page, pageSize }: PageParams) => ({
    index: page,
    size: pageSize,
    total: Math.ceil(history.length / pageSize),
});

const getHistoryHeight = ({ height }: HistoryTx) => (height > 0 ? height : Number.MAX_SAFE_INTEGER);

// Pending transactions first and then the latest blocks first, like sortTxsFromLatest, so that
// the pages follow each other. The history doesn't tell children from parents within a block, so
// the transactions of a block are split between pages by txid and ordered only within a page.
const getHistoryPage = (history: HistoryTx[], { page, pageSize }: PageParams) =>
    [...history]
        .sort(
            (a, b) =>
                getHistoryHeight(b) - getHistoryHeight(a) || a.tx_hash.localeCompare(b.tx_hash),
        )
        .slice((page - 1) * pageSize, page * pageSize);

// Only the transactions of the page are fetched, with the previous transactions of their inputs
// which are in the history. Those of foreign inputs are left out, as an incoming payment can have
// dozens of them, so the fee of such a transaction is unknown until it is fetched by getTransaction
// without a descriptor.
const getTransactionsPage = (
    client: ElectrumAPI,
    history: HistoryTx[],
    pageParams: PageParams,
    transformTransaction: ReturnType<typeof createTransactionTransformer>,
) =>
    getTransactions(client, getHistoryPage(history, pageParams), {
        withForeignParents: false,
        accountTxids: new Set(history.map(({ tx_hash }) => tx_hash)),
    })
        .then(txs => txs.map(transformTransaction))
        .then(sortTxsFromLatest);

type TransactionVinVouts = { details: { vin: VinVout[]; vout: VinVout[] } };

type AddressValues = { sent: number; received: number };

// The sums of sumAddressValues for all the addresses at once, in one pass over the transactions.
export const sumValuesByAddress = (transactions: TransactionVinVouts[]) => {
    const sums = new Map<string, AddressValues>();
    const addValues = (vinVouts: VinVout[], key: keyof AddressValues) =>
        vinVouts.forEach(({ addresses, value }) =>
            addresses?.forEach((address, index, all) => {
                // An input or output listing the same address twice counts once.
                if (all.indexOf(address) !== index) return;
                const values = sums.get(address) ?? { sent: 0, received: 0 };
                values[key] += value ? Number.parseFloat(value) : 0;
                sums.set(address, values);
            }),
        );

    transactions.forEach(({ details }) => {
        addValues(details.vin, 'sent');
        addValues(details.vout, 'received');
    });

    return sums;
};

export const sumAddressValues = <T>(
    transactions: T[],
    address: string,
    getVinVouts: (tr: T) => VinVout[],
) =>
    transactions
        .flatMap(tx =>
            getVinVouts(tx)
                .filter(({ addresses }) => addresses?.includes(address))
                .map(({ value }) => (value ? Number.parseFloat(value) : 0)),
        )
        .reduce((a, b) => a + b, 0);

const getAccountInfo: Api<Req, Res> = async ({ client, addressCache }, payload) => {
    const { descriptor, details = 'basic', page = 1, pageSize = PAGE_SIZE_DEFAULT, gap } = payload;
    const pageParams = { page: Math.max(1, page), pageSize: Math.max(1, pageSize) };
    const network = client.getInfo()?.network;

    const parsed = tryGetScripthash(descriptor, network);
    if (parsed.valid) {
        const { confirmed, unconfirmed, history } = await Promise.all([
            client.request('blockchain.scripthash.get_balance', parsed.scripthash),
            client.request('blockchain.scripthash.get_history', parsed.scripthash),
        ]).then(([{ confirmed, unconfirmed }, history]) => ({
            confirmed,
            unconfirmed,
            history,
        }));
        const historyUnconfirmed = history.filter(r => r.height <= 0).length;

        const transactions =
            details === 'txs'
                ? await getTransactionsPage(
                      client,
                      history,
                      pageParams,
                      createTransactionTransformer(descriptor),
                  )
                : undefined;

        return {
            descriptor,
            balance: confirmed.toString(),
            availableBalance: (confirmed + unconfirmed).toString(),
            empty: !history.length,
            history: {
                total: history.length - historyUnconfirmed,
                unconfirmed: historyUnconfirmed,
                transactions,
            },
            page: details === 'txs' ? getPagination(history, pageParams) : undefined,
        };
    }
    const discover = discoverAddress(client);
    const receive = await discovery(discover, addressCache(descriptor, 'receive'), gap).then(
        getBalances(client),
    );
    const change = await discovery(discover, addressCache(descriptor, 'change'), gap).then(
        getBalances(client),
    );
    const batch = receive.concat(change);
    const [confirmed, unconfirmed] = batch.reduce(
        ([c, u], { confirmed, unconfirmed }) => [c + confirmed, u + unconfirmed],
        [0, 0],
    );
    const history = [
        ...new Map(batch.flatMap(({ history }) => history).map(tx => [tx.tx_hash, tx])).values(),
    ];
    const historyUnconfirmed = history.filter(r => r.height <= 0).length;

    const transformAddressInfo = ({ address, path, history, confirmed }: AddressInfo): Address => ({
        address,
        path,
        transfers: history.length,
        balance: confirmed.toString(), // TODO or confirmed + unconfirmed?
        sent: '0',
        received: '0',
    });

    const addresses = {
        change: change.map(transformAddressInfo),
        unused: receive.filter(recv => !recv.history.length).map(transformAddressInfo),
        used: receive.filter(recv => recv.history.length).map(transformAddressInfo),
    };

    const transformTransaction = createTransactionTransformer(addresses);
    // Suite takes the addresses of an account from the first page only, so on the later pages their
    // sent and received amounts stay 0 instead of fetching all the transactions of the account.
    const hasAddressAmounts =
        ['tokenBalances', 'txids', 'txs'].includes(details) && pageParams.page === 1;
    // All the transactions of the account are needed for the amounts of its addresses, but not
    // the previous transactions of their foreign inputs nor their blocks.
    const accountTransactions = hasAddressAmounts
        ? await getTransactions(client, history, {
              withForeignParents: false,
              withBlocks: false,
          }).then(txs => txs.map(transformTransaction))
        : [];

    const valuesByAddress = sumValuesByAddress(accountTransactions);

    const extendAddressInfo = ({ address, path, transfers, balance }: Address): Address => {
        const { sent, received } = valuesByAddress.get(address) ?? { sent: 0, received: 0 };

        return {
            address,
            path,
            transfers,
            balance: '0',
            sent: '0',
            received: '0',
            ...(['tokenBalances', 'txids', 'txs'].includes(details) && transfers
                ? { balance, sent: sent.toString(), received: received.toString() }
                : {}),
        };
    };

    return {
        descriptor,
        balance: confirmed.toString(),
        availableBalance: (confirmed + unconfirmed).toString(),
        empty: !history.length,
        history: {
            total: history.length - historyUnconfirmed,
            unconfirmed: historyUnconfirmed,
            transactions:
                details === 'txs'
                    ? await getTransactionsPage(client, history, pageParams, transformTransaction)
                    : undefined,
        },
        addresses:
            details !== 'basic'
                ? {
                      change: addresses.change.map(extendAddressInfo),
                      unused: addresses.unused.map(extendAddressInfo),
                      used: addresses.used.map(extendAddressInfo),
                  }
                : undefined,
        page: details === 'txs' ? getPagination(history, pageParams) : undefined,
    };
};

export default getAccountInfo;
