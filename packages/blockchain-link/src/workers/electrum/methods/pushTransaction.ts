import type { PushTransaction as Req } from '@trezor/blockchain-link-types/src/messages';
import type { PushTransaction as Res } from '@trezor/blockchain-link-types/src/responses';

import { Api } from '../utils';

const pushTransaction: Api<Req, Res> = async (client, payload) => {
    const res = await client.request('blockchain.transaction.broadcast', payload);

    return res;
};

export default pushTransaction;
