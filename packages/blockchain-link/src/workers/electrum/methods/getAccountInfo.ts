import {
    Api,
    flatten,
    tryGetScripthash,
    discovery,
    AddressHistory,
    getTransactions,
    sum,
} from '../utils';
import { transformTransaction } from '../../blockbook/utils';
import type { ElectrumAPI } from '../../../types/electrum';
import type { GetAccountInfo as Req } from '../../../types/messages';
import type { GetAccountInfo as Res } from '../../../types/responses';
import type { VinVout } from '../../../types/blockbook';
import type { Address } from '../../../types';

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
            addresses.map(async ({ address, path, history, scripthash }) => {
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
                    confirmed,
                    unconfirmed,
                };
            })
        );

const getAccountInfo: Api<Req, Res> = async (client, payload) => {
    const { descriptor, details = 'basic', pageSize } = payload;

    const parsed = tryGetScripthash(descriptor, client.getInfo()?.network);
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
                ? await getTransactions(client, history).then(txs =>
                      txs.map(tx => transformTransaction(descriptor, undefined, tx))
                  )
                : undefined;

        const page =
            details === 'txids' || details === 'txs'
                ? {
                      index: 1,
                      size: pageSize || PAGE_SIZE_DEFAULT,
                      total: 1,
                  }
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
            page,
        };
    }

    const receive = await discovery(client, descriptor, 'receive').then(getBalances(client));
    const change = await discovery(client, descriptor, 'change').then(getBalances(client));
    const batch = receive.concat(change);
    const [confirmed, unconfirmed] = batch.reduce(
        ([c, u], { confirmed, unconfirmed }) => [c + confirmed, u + unconfirmed],
        [0, 0]
    );
    const history = flatten(batch.map(({ history }) => history));
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
        ? await getTransactions(client, history).then(txs =>
              txs.map(tx => transformTransaction(descriptor, addresses, tx))
          )
        : [];

    const sumAddressValues = (
        address: string,
        getVinVouts: (tr: ReturnType<typeof transformTransaction>) => VinVout[]
    ) =>
        flatten(
            transactions.map(tx =>
                getVinVouts(tx)
                    .filter(({ addresses }) => addresses?.includes(address))
                    .map(({ value }) => (value ? Number.parseFloat(value) : 0))
            )
        ).reduce(sum, 0);

    const extendAddressInfo = ({ address, path, transfers, balance }: Address): Address => ({
        address,
        path,
        transfers,
        ...(['tokenBalances', 'txids', 'txs'].includes(details) && transfers
            ? {
                  balance,
                  sent: sumAddressValues(address, tx => tx.details.vin).toString(),
                  received: sumAddressValues(address, tx => tx.details.vout).toString(),
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
    };
};

export default getAccountInfo;
