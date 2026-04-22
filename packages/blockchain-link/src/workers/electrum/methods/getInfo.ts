import type { MessageTypes, ResponseTypes } from '@trezor/blockchain-link-types';
import { throwError } from '@trezor/utils';

import { type Api, blockheaderToBlockhash } from '../utils';

type Req = MessageTypes.GetInfo;
type Res = ResponseTypes.GetInfo;

const getInfo: Api<Req, Res> = client => {
    const {
        url,
        coin,
        block: { hex, height },
        version: [_name, version],
    } = client.getInfo() || throwError('Client not initialized');

    return Promise.resolve({
        url,
        version,
        blockHeight: height,
        blockHash: blockheaderToBlockhash(hex),
        name: 'Bitcoin',
        shortcut: coin,
        network: coin,
        testnet: coin === 'REGTEST',
        decimals: 8,
    });
};

export default getInfo;
