import { Api, blockheaderToBlockhash, fail } from '../utils';
import type { GetInfo as Req } from '../../../types/messages';
import type { GetInfo as Res } from '../../../types/responses';

const getInfo: Api<Req, Res> = client => {
    const {
        url,
        coin,
        block: { hex, height },
        version: [_name, version],
    } = client.getInfo() || fail('Client not initialized');
    return Promise.resolve({
        url,
        version,
        blockHeight: height,
        blockHash: blockheaderToBlockhash(hex),
        name: 'Bitcoin',
        shortcut: coin,
        testnet: coin === 'REGTEST',
        decimals: 8,
    });
};

export default getInfo;
