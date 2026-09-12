import { getEthereumNetwork } from '../../data/coinInfo';
import type { getNetworkLabel } from '../ethereumUtils';

export const getNetworkLabelFixtures: TestFixtures<typeof getNetworkLabel> = [
    {
        description: 'eth',
        input: ['Export #NETWORK address', getEthereumNetwork('eth')],
        output: 'Export Ethereum address',
    },
];
