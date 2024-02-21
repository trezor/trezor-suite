import { discovery } from '@trezor/utxo-lib';
import { sortTxsFromLatest } from '@trezor/blockchain-link-utils';
import { Api, tryGetScripthash, discoverAddress, AddressHistory, getTransactions } from '../utils';
import { blockbookUtils } from '@trezor/blockchain-link-utils';
import type { ElectrumAPI } from '@trezor/blockchain-link-types/lib/electrum';
import type { GetAccountInfo as Req } from '@trezor/blockchain-link-types/lib/messages';
import type { GetAccountInfo as Res } from '@trezor/blockchain-link-types/lib/responses';
import type { VinVout } from '@trezor/blockchain-link-types/lib/blockbook';
import type { Address, Transaction } from '@trezor/blockchain-link-types';

// const PAGE_DEFAULT = 0;
const PAGE_SIZE_DEFAULT = 25;

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

const getPagination = (perPage: number, txs: Transaction[]) => ({
    index: 1,
    // Intentionally incorrect as Electrum backend doesn't support pagination yet but Suite needs total page count
    size: perPage,
    total: Math.ceil(txs.length / perPage),
});

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

const getAccountInfo: Api<Req, Res> = async (client, payload) => {
    const { descriptor, details = 'basic', pageSize = PAGE_SIZE_DEFAULT } = payload;
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
                ? await getTransactions(client, history)
                      .then(txs =>
                          txs.map(tx => blockbookUtils.transformTransaction(tx, descriptor)),
                      )
                      .then(sortTxsFromLatest)
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
            page: details === 'txs' ? getPagination(pageSize, transactions ?? []) : undefined,
        };
    }
    const discover = discoverAddress(client);
    const receive = await discovery(discover, descriptor, 'receive', network).then(
        getBalances(client),
    );
    const change = await discovery(discover, descriptor, 'change', network).then(
        getBalances(client),
    );
    const batch = receive.concat(change);
    const [confirmed, unconfirmed] = batch.reduce(
        ([c, u], { confirmed, unconfirmed }) => [c + confirmed, u + unconfirmed],
        [0, 0],
    );
    const history = batch.flatMap(({ history }) => history);
    const historyUnconfirmed = history.filter(r => r.height <= 0).length;

    const transformAddressInfo = ({ address, path, history, confirmed }: AddressInfo): Address => ({
        address,
        path,
        transfers: history.length,
        balance: confirmed.toString(), // TODO or confirmed + unconfirmed?
    });

    const addresses = {
        change: change.map(transformAddressInfo),
        unused: receive.filter(recv => !recv.history.length).map(transformAddressInfo),
        used: receive.filter(recv => recv.history.length).map(transformAddressInfo),
    };

    const transactions = ['tokenBalances', 'txids', 'txs'].includes(details)
        ? await getTransactions(client, history)
              .then(txs => txs.map(tx => blockbookUtils.transformTransaction(tx, addresses)))
              .then(sortTxsFromLatest)
        : [];

    const extendAddressInfo = ({ address, path, transfers, balance }: Address): Address => ({
        address,
        path,
        transfers,
        ...(['tokenBalances', 'txids', 'txs'].includes(details) && transfers
            ? {
                  balance,
                  sent: sumAddressValues(transactions, address, tx => tx.details.vin).toString(),
                  received: sumAddressValues(
                      transactions,
                      address,
                      tx => tx.details.vout,
                  ).toString(),
              }
            : {}),
    });

    return {
        descriptor,
        balance: confirmed.toString(),
        availableBalance: (confirmed + unconfirmed).toString(),
        empty: !history.length,
        history: {
            total: history.length - historyUnconfirmed,
            unconfirmed: historyUnconfirmed,
            transactions: details === 'txs' ? transactions : undefined,
        },
        addresses:
            details !== 'basic'
                ? {
                      change: addresses.change.map(extendAddressInfo),
                      unused: addresses.unused.map(extendAddressInfo),
                      used: addresses.used.map(extendAddressInfo),
                  }
                : undefined,
        page: details === 'txs' ? getPagination(pageSize, transactions) : undefined,
    };
};

export default getAccountInfo;
