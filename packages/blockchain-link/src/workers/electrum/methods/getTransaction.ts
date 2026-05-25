import type { MessageTypes, ResponseTypes } from '@trezor/blockchain-link-types';
import { transformTransaction } from '@trezor/blockchain-link-utils/src/blockbook';

import { type Api, getTransactions } from '../utils';

type Req = MessageTypes.GetTransaction;
type Res = ResponseTypes.GetTransaction;

const getTransaction: Api<Req, Res> = async ({ client }, payload) => {
    const txs = await getTransactions(client, [{ tx_hash: payload, height: -1 }]);
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const tx: (typeof txs)[number] = txs[0];

    return transformTransaction(tx);
};

export default getTransaction;
