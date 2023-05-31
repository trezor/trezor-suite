import coinsJSON from '@trezor/connect-common/files/coins.json';
import coinsJSONEth from '@trezor/connect-common/files/coins-eth.json';

import { getAccountLabel, isUtxoBased } from '../accountUtils';

import {
    parseCoinsJson,
    getBitcoinNetwork,
    getEthereumNetwork,
    getMiscNetwork,
} from '../../data/coinInfo';

parseCoinsJson({
    ...coinsJSON,
    eth: coinsJSONEth,
});

export const getAccountLabelFixtures: TestFixtures<typeof getAccountLabel> = [
    {
        description: 'Legacy',
        input: [[44], getBitcoinNetwork('btc')!],
        output: 'legacy <span>account #1</span>',
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
