import type {
    ElectrumAPI,
    ElectrumHistoryTx as HistoryTx,
    MessageTypes,
    ResponseTypes,
} from '@trezor/blockchain-link-types';
import { transformTransaction } from '@trezor/blockchain-link-utils/src/blockbook';
import { throwError } from '@trezor/utils';
import { type AddressCache, discovery } from '@trezor/utxo-lib';

import {
    type Api,
    discoverAddress,
    getTransactionByTxid,
    getTransactions,
    tryGetScripthash,
} from '../utils';

type Req = MessageTypes.GetTransaction;
type Res = ResponseTypes.GetTransaction;

type GetAccountTransactionParams = {
    client: ElectrumAPI;
    addressCache: AddressCache;
    descriptor: string;
    txid: string;
};

// Like for the UTXOs of the account, the responses for its addresses are cached by their status.
const getAccountHistory = async ({
    client,
    addressCache,
    descriptor,
}: Omit<GetAccountTransactionParams, 'txid'>): Promise<HistoryTx[]> => {
    const parsed = tryGetScripthash(descriptor, client.getInfo()?.network);
    if (parsed.valid) return client.request('blockchain.scripthash.get_history', parsed.scripthash);

    const discover = discoverAddress(client);
    const receive = await discovery(discover, addressCache(descriptor, 'receive'));
    const change = await discovery(discover, addressCache(descriptor, 'change'));

    return receive.concat(change).flatMap(({ history }) => history);
};

// A transaction of the history of the account is fetched raw like the transactions of its pages,
// with the previous transactions of its own inputs only, which is enough for what the transaction
// means for the account and its time (e.g. of a UTXO). Any other is fetched with all of them.
const getAccountTransaction = async (params: GetAccountTransactionParams) => {
    const { client, txid } = params;
    const history = await getAccountHistory(params);
    const historyTx = history.find(({ tx_hash }) => tx_hash === txid);
    if (!historyTx) return getTransactionByTxid(client, txid);

    const [tx] = await getTransactions(client, [historyTx], {
        withForeignParents: false,
        accountTxids: new Set(history.map(({ tx_hash }) => tx_hash)),
    });

    return tx ?? throwError(`Transaction ${txid} not found`);
};

const getTransaction: Api<Req, Res> = async ({ client, addressCache }, { txid, descriptor }) => {
    if (!descriptor) return transformTransaction(await getTransactionByTxid(client, txid));

    const tx = await getAccountTransaction({ client, addressCache, descriptor, txid });
    const addresses = {
        // It doesn't matter for transformTransaction which receive addrs are used and which are unused
        used: [],
        unused: addressCache(descriptor, 'receive').getAllDerived(),
        change: addressCache(descriptor, 'change').getAllDerived(),
    };

    return transformTransaction(tx, addresses);
};

export default getTransaction;
