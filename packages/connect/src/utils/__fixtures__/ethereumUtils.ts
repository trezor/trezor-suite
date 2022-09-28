import coinsJSON from '@trezor/connect-common/files/coins.json';

import { getNetworkLabel } from '../ethereumUtils';

import { parseCoinsJSON, getEthereumNetwork } from '../../data/coinInfo';

parseCoinsJSON(coinsJSON);

export const getNetworkLabelFixtures: TestFixtures<typeof getNetworkLabel> = [
    {
        description: 'eth',
        input: ['Export #NETWORK address', getEthereumNetwork('eth')],
        output: 'Export Ethereum address',
    },
    {
        description: 'etc',
        input: ['Export #NETWORK address', getEthereumNetwork('etc')],
        output: 'Export Ethereum Classic address',
    },
];
