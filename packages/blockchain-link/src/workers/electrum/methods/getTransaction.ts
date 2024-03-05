import { Api, getTransactions } from '../utils';
import { transformTransaction } from '@trezor/blockchain-link-utils/src/blockbook';
import type { GetTransaction as Req } from '@trezor/blockchain-link-types/src/messages';
import type { GetTransaction as Res } from '@trezor/blockchain-link-types/src/responses';

const getTransaction: Api<Req, Res> = async (client, payload) => {
    const [tx] = await getTransactions(client, [{ tx_hash: payload, height: -1 }]);

    return transformTransaction(tx);
};

export default getTransaction;
