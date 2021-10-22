import { Api } from '../utils';
import type { PushTransaction as Req } from '../../../types/messages';
import type { PushTransaction as Res } from '../../../types/responses';

const pushTransaction: Api<Req, Res> = async (client, payload) => {
    const res = await client.request('blockchain.transaction.broadcast', payload);
    return res;
};

export default pushTransaction;
