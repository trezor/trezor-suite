import coinsJSON from '@trezor/connect-common/files/coins.json';

import { formatAmount } from '../formatUtils';

import { parseCoinsJSON, getBitcoinNetwork } from '../../data/coinInfo';

parseCoinsJSON(coinsJSON);

export const formatAmountFixtures: TestFixtures<typeof formatAmount> = [
    {
        description: '10',
        input: ['10', getBitcoinNetwork('btc')!],
        output: '0.0000001 BTC',
    },
];
