import coinsJSONEth from '@trezor/connect-common/files/coins-eth.json';
import coinsJSON from '@trezor/connect-common/files/coins.json';

import { getEthereumNetwork, parseCoinsJson } from '../../data/coinInfo';
import { getNetworkLabel } from '../ethereumUtils';

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
