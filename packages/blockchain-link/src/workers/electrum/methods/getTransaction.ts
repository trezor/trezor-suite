import type { MessageTypes, ResponseTypes } from '@trezor/blockchain-link-types';
import { transformTransaction } from '@trezor/blockchain-link-utils/src/blockbook';

import { type Api, getTransactions } from '../utils';

type Req = MessageTypes.GetTransaction;
type Res = ResponseTypes.GetTransaction;

const getTransaction: Api<Req, Res> = async ({ client, addressCache }, { txid, descriptor }) => {
    const txs = await getTransactions(client, [{ tx_hash: txid, height: -1 }]);
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const tx: (typeof txs)[number] = txs[0];

    const addresses = descriptor
        ? {
              // It doesn't matter for transformTransaction which receive addrs are used and which are unused
              used: [],
              unused: addressCache(descriptor, 'receive').getAllDerived(),
              change: addressCache(descriptor, 'change').getAllDerived(),
          }
        : undefined;

    return transformTransaction(tx, addresses);
};

export default getTransaction;
