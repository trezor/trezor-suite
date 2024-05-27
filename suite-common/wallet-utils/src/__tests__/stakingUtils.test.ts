import { Account } from '@suite-common/wallet-types';

import { getAccountAutocompoundBalance, getAccountEverstakeStakingPool } from '../stakingUtils';
import {
    getAccountAutocompoundBalanceFixtures,
    getAccountEverstakeStakingPoolFixtures,
} from '../__fixtures__/stakingUtils';

describe('getAccountEverstakeStakingPool', () => {
    getAccountEverstakeStakingPoolFixtures.forEach(({ description, account, expected }) => {
        it(description, () => {
            const result = getAccountEverstakeStakingPool(account as unknown as Account);
            expect(result).toEqual(expected);
        });
    });
});

describe('getAccountAutocompoundBalance', () => {
    getAccountAutocompoundBalanceFixtures.forEach(({ description, account, expectedBalance }) => {
        it(description, () => {
            const result = getAccountAutocompoundBalance(account as unknown as Account);
            expect(result).toEqual(expectedBalance);
        });
    });
});
