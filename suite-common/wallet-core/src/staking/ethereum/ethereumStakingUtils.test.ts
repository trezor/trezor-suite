import { type Account } from '@suite-common/wallet-types';

import {
    getAccountAutocompoundBalanceFixtures,
    getUnstakeAmountByEthereumDataHexFixtures,
} from './__fixtures__/ethereumStakingUtils';
import {
    getAccountAutocompoundBalance,
    getUnstakeAmountByEthereumDataHex,
} from './ethereumStakingUtils';

describe('getAccountAutocompoundBalance', () => {
    getAccountAutocompoundBalanceFixtures.forEach(({ description, account, expectedBalance }) => {
        it(description, () => {
            const result = getAccountAutocompoundBalance(account as unknown as Account);
            expect(result).toEqual(expectedBalance);
        });
    });
});

describe('getUnstakeAmountByEthereumDataHex', () => {
    getUnstakeAmountByEthereumDataHexFixtures.forEach(f => {
        it(f.description, () => {
            const result = getUnstakeAmountByEthereumDataHex(f.transactionData);
            expect(result).toBe(f.expectedAmountWei);
        });
    });
});
