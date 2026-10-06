import { getBitcoinNetwork, getEthereumNetwork, getMiscNetwork } from '../../data/coinInfo';
import type { getAccountLabel, isUtxoBased } from '../accountUtils';

export const getAccountLabelFixtures: TestFixtures<typeof getAccountLabel> = [
    {
        description: 'Legacy',
        input: [[44], getBitcoinNetwork('btc')!],
        output: 'legacy account #1',
    },
];

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
