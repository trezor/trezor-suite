import { Api, blockheaderToBlockhash } from '../utils';
import type { GetBlockHash as Req } from '@trezor/blockchain-link-types/lib/messages';
import type { GetBlockHash as Res } from '@trezor/blockchain-link-types/lib/responses';

const getBlockHash: Api<Req, Res> = async (client, payload) => {
    const blockheader = await client.request('blockchain.block.header', payload);

    return blockheaderToBlockhash(blockheader);
};

export default getBlockHash;
