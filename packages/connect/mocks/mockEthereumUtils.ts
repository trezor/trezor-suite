import { getEthereumNetwork } from '../src/data/coinInfo';
import type { getNetworkLabel } from '../src/utils/ethereumUtils';

export const getNetworkLabelFixtures: TestFixtures<typeof getNetworkLabel> = [
    {
        description: 'eth',
        input: ['Export #NETWORK address', getEthereumNetwork('eth')],
        output: 'Export Ethereum address',
    },
];
