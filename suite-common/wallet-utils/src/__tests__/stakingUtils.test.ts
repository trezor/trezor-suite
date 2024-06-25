import { Account } from '@suite-common/wallet-types';

import {
    getAccountAutocompoundBalance,
    getAccountTotalStakingBalance,
    getAccountEverstakeStakingPool,
} from '../stakingUtils';
import {
    getAccountAutocompoundBalanceFixtures,
    getAccountEverstakeStakingPoolFixtures,
    getAccountTotalStakingBalanceFixtures,
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

describe('getAccountTotalStakingBalance', () => {
    getAccountTotalStakingBalanceFixtures.forEach(({ description, account, expectedBalance }) => {
        it(description, () => {
            const result = getAccountTotalStakingBalance(account as unknown as Account);
            expect(result).toEqual(expectedBalance);
        });
    });
});
