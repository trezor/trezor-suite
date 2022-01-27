import {
    Api,
    tryGetScripthash,
    getTransactions,
    discovery,
    flatten,
    AddressHistory,
} from '../utils';
import { transformTransaction } from '../../blockbook/utils';
import type { GetAccountBalanceHistory as Req } from '../../../types/messages';
import type { GetAccountBalanceHistory as Res } from '../../../types/responses';
import type { AccountAddresses, Transaction } from '../../../types/common';
import type { HistoryTx } from '../../../types/electrum';

const transformAddress = (addr: AddressHistory) => ({
    address: addr.address,
    path: addr.path,
    transfers: addr.history.length,
});

const aggregateTransactions = (txs: (Transaction & { blockTime: number })[], groupBy = 3600) => {
    const result: Res['payload'] = [];
    let i = 0;
    while (i < txs.length) {
        const time = Math.floor(txs[i].blockTime / groupBy) * groupBy;
        let j = i;
        let received = 0;
        let sent = 0;
        let sentToSelf = 0;
        while (j < txs.length && txs[j].blockTime < time + groupBy) {
            const {
                type,
                totalSpent,
                details: { totalInput, totalOutput },
            } = txs[j];
            if (type === 'recv') received += Number.parseInt(totalSpent, 10);
            else if (type === 'sent') sent += Number.parseInt(totalSpent, 10);
            else if (type === 'self') {
                sentToSelf += Number.parseInt(totalOutput, 10);
                sent += Number.parseInt(totalInput, 10);
                received += Number.parseInt(totalOutput, 10);
            }
            j++;
        }
        result.push({
            time,
            txs: j - i,
            received: received.toString(),
            sent: sent.toString(),
            sentToSelf: sentToSelf.toString(),
            rates: {},
        });
        i = j;
    }
    return result;
};

const getAccountBalanceHistory: Api<Req, Res> = async (
    client,
    { descriptor, from, to, groupBy }
) => {
    let history: HistoryTx[];
    let addresses: AccountAddresses | undefined;

    const parsed = tryGetScripthash(descriptor, client.getInfo()?.network);
    if (parsed.valid) {
        history = await client.request('blockchain.scripthash.get_history', parsed.scripthash);
        addresses = undefined;
    } else {
        const receive = await discovery(client, descriptor, 'receive');
        const change = await discovery(client, descriptor, 'change');
        addresses = {
            change: change.map(transformAddress),
            used: receive.filter(({ history }) => history.length).map(transformAddress),
            unused: receive.filter(({ history }) => !history.length).map(transformAddress),
        };
        history = flatten(
            receive.map(({ history }) => history).concat(change.map(({ history }) => history))
        );
    }

    const txs = await getTransactions(client, history).then(txs =>
        txs
            .filter(
                ({ blockTime }) =>
                    (from || 0) <= blockTime && blockTime <= (to || Number.MAX_SAFE_INTEGER)
            )
            .sort((a, b) => a.blockTime - b.blockTime)
            .map(tx => ({ blockTime: -1, ...transformTransaction(descriptor, addresses, tx) }))
    );

    return aggregateTransactions(txs, groupBy);
};

export default getAccountBalanceHistory;
