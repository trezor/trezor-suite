import type { MessageTypes, ResponseTypes } from '@trezor/blockchain-link-types';

import { type Api } from '../utils';

type Req = MessageTypes.PushTransaction;
type Res = ResponseTypes.PushTransaction;

const pushTransaction: Api<Req, Res> = async ({ client }, payload) => {
    const res = await client.request('blockchain.transaction.broadcast', payload.hex);

    return res;
};

export default pushTransaction;
