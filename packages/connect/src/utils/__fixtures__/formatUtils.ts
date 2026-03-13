import coinsJSON from '@trezor/connect-data/files/coins.json';

import { getBitcoinNetwork, parseCoinsJson } from '../../data/coinInfo';
import type { formatAmount } from '../formatUtils';

parseCoinsJson(coinsJSON);

export const formatAmountFixtures: TestFixtures<typeof formatAmount> = [
    {
        description: '10',
        input: ['10', getBitcoinNetwork('btc')!],
        output: '0.0000001 BTC',
    },
];
