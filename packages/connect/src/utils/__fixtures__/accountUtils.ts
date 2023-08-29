import coinsJSON from '@trezor/connect-common/files/coins.json';
import coinsJSONEth from '@trezor/connect-common/files/coins-eth.json';
import blockchainLinkJSON from '@trezor/connect-common/files/blockchain-link.json';

import { getAccountLabel, isUtxoBased } from '../accountUtils';

import {
    parseCoinsJson,
    getBitcoinNetwork,
    getEthereumNetworkFromCoinsJSON,
    getMiscNetwork,
} from '../../data/coinInfo';

parseCoinsJson(
    {
        ...coinsJSON,
        eth: coinsJSONEth,
    },
    blockchainLinkJSON,
);

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
