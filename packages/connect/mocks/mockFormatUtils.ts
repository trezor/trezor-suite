import { getBitcoinNetwork } from '../src/data/coinInfo';
import type { formatAmount } from '../src/utils/formatUtils';

export const formatAmountFixtures: TestFixtures<typeof formatAmount> = [
    {
        description: '10',
        input: ['10', getBitcoinNetwork('btc')!],
        output: '0.0000001 BTC',
    },
];
