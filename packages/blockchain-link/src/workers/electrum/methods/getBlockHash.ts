import type { MessageTypes, ResponseTypes } from '@trezor/blockchain-link-types';

import { type Api, blockheaderToBlockhash } from '../utils';

type Req = MessageTypes.GetBlockHash;
type Res = ResponseTypes.GetBlockHash;

const getBlockHash: Api<Req, Res> = async ({ client }, payload) => {
    const blockheader = await client.request('blockchain.block.header', payload);

    return blockheaderToBlockhash(blockheader);
};

export default getBlockHash;
