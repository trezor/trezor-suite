import coinsJSONEth from '@trezor/connect-data/files/coins-eth.json';
import coinsJSON from '@trezor/connect-data/files/coins.json';

import { getEthereumNetwork, parseCoinsJson } from '../../data/coinInfo';
import type { getNetworkLabel } from '../ethereumUtils';

parseCoinsJson({
    ...coinsJSON,
    ...coinsJSONEth,
});

export const getNetworkLabelFixtures: TestFixtures<typeof getNetworkLabel> = [
    {
        description: 'eth',
        input: ['Export #NETWORK address', getEthereumNetwork('eth')],
        output: 'Export Ethereum address',
    },
];
