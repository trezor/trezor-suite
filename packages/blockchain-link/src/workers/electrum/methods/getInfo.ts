import { Api, blockheaderToBlockhash, fail } from '../utils';
import type { GetInfo as Req } from '../../../types/messages';
import type { GetInfo as Res } from '../../../types/responses';

const NETWORK_INFO = {
    name: 'Bitcoin',
    shortcut: 'BTC',
    testnet: false,
    decimals: 8,
};

const getInfo: Api<Req, Res> = client => {
    const {
        url,
        block: { hex, height },
        version: [_name, version],
    } = client.getInfo() || fail('Client not initialized');
    return Promise.resolve({
        url,
        version,
        blockHeight: height,
        blockHash: blockheaderToBlockhash(hex),
        ...NETWORK_INFO,
    });
};

export default getInfo;
