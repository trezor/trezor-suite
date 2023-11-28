import BigNumber from 'bignumber.js';
import { discovery } from '@trezor/utxo-lib';
import { sumVinVout } from '@trezor/blockchain-link-utils';
import { Api, tryGetScripthash, getTransactions, discoverAddress, AddressHistory } from '../utils';
import { transformTransaction } from '@trezor/blockchain-link-utils/lib/blockbook';
import type { GetAccountBalanceHistory as Req } from '@trezor/blockchain-link-types/lib/messages';
import type { GetAccountBalanceHistory as Res } from '@trezor/blockchain-link-types/lib/responses';
import type { AccountAddresses, Transaction } from '@trezor/blockchain-link-types/lib/common';
import type { HistoryTx } from '@trezor/blockchain-link-types/lib/electrum';

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
                amount,
                fee,
                details: { vin, vout, totalInput, totalOutput },
            } = txs[j];
            if (type === 'recv') received += Number.parseInt(amount, 10);
            else if (type === 'sent')
                sent += Number.parseInt(amount, 10) + Number.parseInt(fee, 10);
            else if (type === 'self') {
                sentToSelf += Number.parseInt(totalOutput, 10);
                sent += Number.parseInt(totalInput, 10);
                received += Number.parseInt(totalOutput, 10);
            } else if (type === 'joint') {
                const myTotalInput = new BigNumber(
                    vin.filter(vin => vin.isAccountOwned).reduce(sumVinVout, 0),
                ).toNumber();
                const myTotalOutput = new BigNumber(
                    vout.filter(vout => vout.isAccountOwned).reduce(sumVinVout, 0),
                ).toNumber();
                sent += myTotalInput;
                received += myTotalOutput;
                sentToSelf += Math.min(myTotalInput, myTotalOutput);
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
    { descriptor, from, to, groupBy },
) => {
    let history: HistoryTx[];
    let addresses: AccountAddresses | undefined;
    const network = client.getInfo()?.network;

    const parsed = tryGetScripthash(descriptor, network);
    if (parsed.valid) {
        history = await client.request('blockchain.scripthash.get_history', parsed.scripthash);
        addresses = undefined;
    } else {
        const discover = discoverAddress(client);
        const receive = await discovery(discover, descriptor, 'receive', network);
        const change = await discovery(discover, descriptor, 'change', network);
        addresses = {
            change: change.map(transformAddress),
            used: receive.filter(({ history }) => history.length).map(transformAddress),
            unused: receive.filter(({ history }) => !history.length).map(transformAddress),
        };
        history = receive
            .map(({ history }) => history)
            .concat(change.map(({ history }) => history))
            .flat();
    }

    const txs = await getTransactions(client, history).then(txs =>
        txs
            .filter(
                ({ blockTime }) =>
                    (from || 0) <= blockTime && blockTime <= (to || Number.MAX_SAFE_INTEGER),
            )
            .sort((a, b) => a.blockTime - b.blockTime)
            .map(tx => ({ blockTime: -1, ...transformTransaction(tx, addresses ?? descriptor) })),
    );

    return aggregateTransactions(txs, groupBy);
};

export default getAccountBalanceHistory;
