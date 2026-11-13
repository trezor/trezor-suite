import { getBitcoinNetwork, getEthereumNetwork, getMiscNetwork } from '../../data/coinInfo';
import type { isUtxoBased } from '../accountUtils';

export const isUtxoBasedFixtures: TestFixtures<typeof isUtxoBased> = [
    {
        description: 'btc',
        input: [getBitcoinNetwork('btc')!],
        output: true,
    },
    {
        description: 'ada',
        input: [getMiscNetwork('ada')!],
        output: true,
    },
    {
        description: 'eth',
        input: [getEthereumNetwork('eth')!],
        output: false,
    },
];
