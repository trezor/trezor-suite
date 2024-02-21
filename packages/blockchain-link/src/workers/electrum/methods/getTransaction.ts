import { Api, getTransactions } from '../utils';
import { blockbookUtils } from '@trezor/blockchain-link-utils';
import type { GetTransaction as Req } from '@trezor/blockchain-link-types/lib/messages';
import type { GetTransaction as Res } from '@trezor/blockchain-link-types/lib/responses';

const getTransaction: Api<Req, Res> = async (client, payload) => {
    const [tx] = await getTransactions(client, [{ tx_hash: payload, height: -1 }]);

    return blockbookUtils.transformTransaction(tx);
};

export default getTransaction;
