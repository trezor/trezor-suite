import { Account } from '@suite-common/wallet-types';

import {
    getAccountAutocompoundBalance,
    getAccountTotalStakingBalance,
    getAccountEverstakeStakingPool,
    getUnstakeAmountByEthereumDataHex,
} from '../ethereumStakingUtils';
import {
    getAccountAutocompoundBalanceFixtures,
    getAccountEverstakeStakingPoolFixtures,
    getAccountTotalStakingBalanceFixtures,
    getUnstakeAmountByEthereumDataHexFixtures,
} from '../__fixtures__/ethereumStakingUtils';

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

describe('getUnstakeAmountByEthereumDataHex', () => {
    getUnstakeAmountByEthereumDataHexFixtures.forEach(f => {
        it(f.description, () => {
            const result = getUnstakeAmountByEthereumDataHex(f.ethereumData);
            expect(result).toBe(f.expectedAmountWei);
        });
    });
});
